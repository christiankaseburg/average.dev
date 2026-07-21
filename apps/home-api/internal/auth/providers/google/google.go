package google

import (
	"context"
	"fmt"
	"strings"

	"average.dev/apps/home-api/internal/auth"
	"average.dev/apps/home-api/internal/config"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)

type Provider struct {
	provider *oidc.Provider
	verifier *oidc.IDTokenVerifier
	config   *oauth2.Config
}

// NewProvider initializes the Google OIDC Provider.
func NewProvider(ctx context.Context, cfg *config.Config) (*Provider, error) {
	if cfg.GoogleIssuer == "" || cfg.GoogleClientID == "" {
		return nil, fmt.Errorf("google issuer and client id are required")
	}

	provider, err := oidc.NewProvider(ctx, cfg.GoogleIssuer)
	if err != nil {
		return nil, fmt.Errorf("failed to create oidc provider: %w", err)
	}

	oidcConfig := &oidc.Config{
		ClientID: cfg.GoogleClientID,
	}
	verifier := provider.Verifier(oidcConfig)

	scopes := []string{oidc.ScopeOpenID, "profile", "email"}

	oauth2Config := &oauth2.Config{
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		RedirectURL:  cfg.GoogleRedirectURI,
		Endpoint:     provider.Endpoint(),
		Scopes:       scopes,
	}

	return &Provider{
		provider: provider,
		verifier: verifier,
		config:   oauth2Config,
	}, nil
}

// GetLoginURL returns the Google OAuth consent screen URL.
func (p *Provider) GetLoginURL(state string) string {
	// Requesting offline access to receive a refresh token
	return p.config.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.ApprovalForce)
}

// Exchange swaps an authorization code for standard OAuth2 tokens.
func (p *Provider) Exchange(ctx context.Context, code string) (*oauth2.Token, error) {
	return p.config.Exchange(ctx, code)
}

// Refresh leverages the refresh token to yield fresh access tokens.
func (p *Provider) Refresh(ctx context.Context, refreshToken string) (*oauth2.Token, error) {
	ts := p.config.TokenSource(ctx, &oauth2.Token{RefreshToken: refreshToken})
	return ts.Token()
}

// ValidateToken verifies the ID token cryptographically against Google's keystore and parses the claims.
func (p *Provider) ValidateToken(ctx context.Context, token string) (*auth.IdentityClaims, error) {
	// Strip Bearer prefix if present
	token = strings.TrimPrefix(token, "Bearer ")

	verifierConfig := &oidc.Config{
		ClientID:          p.config.ClientID,
		SkipClientIDCheck: true,
	}

	atVerifier := p.provider.Verifier(verifierConfig)

	idToken, err := atVerifier.Verify(ctx, token)
	if err != nil {
		return nil, fmt.Errorf("failed to verify google token: %w", err)
	}

	var claims struct {
		Sub           string `json:"sub"`
		Email         string `json:"email"`
		EmailVerified bool   `json:"email_verified"`
		Name          string `json:"name"`
		Picture       string `json:"picture"`
		GivenName     string `json:"given_name"`
		FamilyName    string `json:"family_name"`
	}

	if err := idToken.Claims(&claims); err != nil {
		return nil, fmt.Errorf("failed to parse google claims: %w", err)
	}

	return &auth.IdentityClaims{
		Provider:   "google",
		ProviderID: claims.Sub,
		Email:      claims.Email,
		Name:       claims.Name,
		Groups:     []string{}, // Google consumer accounts don't return standard corporate groups
	}, nil
}
