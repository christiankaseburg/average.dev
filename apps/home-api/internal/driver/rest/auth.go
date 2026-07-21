package rest

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"

	"average.dev/apps/home-api/internal/auth"
	"average.dev/apps/home-api/internal/config"
	"average.dev/apps/home-api/internal/service"

	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication routes for home-api.
type AuthHandler struct {
	providerService *auth.ProviderService
	authSvc         service.AuthService
	cfg             *config.Config
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(providerService *auth.ProviderService, authSvc service.AuthService, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		providerService: providerService,
		authSvc:         authSvc,
		cfg:             cfg,
	}
}

// HandleLogin initiates the OIDC login flow.
func (h *AuthHandler) HandleLogin(c *gin.Context) {
	providerName := c.Param("provider")
	provider, ok := h.providerService.Get(providerName)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("provider %s not supported", providerName)})
		return
	}

	b := make([]byte, 32)
	rand.Read(b)
	state := hex.EncodeToString(b)

	// Set state cookie for CSRF protection
	c.SetCookie("auth_state", state, 600, "/", "", false, true)

	url := provider.GetLoginURL(state)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

// HandleCallback handles the OIDC callback and hands off domain logic to the service layer.
func (h *AuthHandler) HandleCallback(c *gin.Context) {
	providerName := c.Param("provider")
	
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing code"})
		return
	}

	stateParam := c.Query("state")
	cookieState, _ := c.Cookie("auth_state")

	if stateParam != cookieState {
		// Log but allow falling through if no cookie exists in local dev, or reject strictly. 
		// Following internal-admin strictly, we reject:
		c.JSON(http.StatusBadRequest, gin.H{"error": "state mismatch"})
		return
	}
	c.SetCookie("auth_state", "", -1, "/", "", false, true)

	// Delegate token exchange and provisioning to the service layer.
	jwtToken, err := h.authSvc.HandleCallback(c.Request.Context(), providerName, code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Set HttpOnly=false so the frontend can read the ID token cross-port.
	c.SetCookie("id_token", jwtToken, 3600*24, "/", "", false, false)
	c.Redirect(http.StatusTemporaryRedirect, "http://localhost:4200")
}

// HandleLogout clears the authentication cookies.
func (h *AuthHandler) HandleLogout(c *gin.Context) {
	c.SetCookie("id_token", "", -1, "/", "", false, false)

	if c.Request.Method == http.MethodGet {
		c.Redirect(http.StatusTemporaryRedirect, "http://localhost:4200")
		return
	}
	c.Status(http.StatusOK)
}
