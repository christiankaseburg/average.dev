package auth

import (
	"context"

	"golang.org/x/oauth2"
)

// IdentityClaims represents the claims extracted from an OIDC token.
type IdentityClaims struct {
	Provider   string
	ProviderID string // The unique identifier from the provider (e.g. sub/oid)
	Email      string
	Name       string
	Groups     []string
}

// Provider defines the interface for validating authentication tokens.
type Provider interface {
	ValidateToken(ctx context.Context, token string) (*IdentityClaims, error)
	GetLoginURL(state string) string
	Exchange(ctx context.Context, code string) (*oauth2.Token, error)
	Refresh(ctx context.Context, refreshToken string) (*oauth2.Token, error)
}

// contextKey is a private string type to prevent collisions in the context map.
type contextKey string

const (
	actorKey contextKey = "actor"
)

// Actor represents the authenticated entity making the request.
type Actor struct {
	UserID         int64
}

// WithActor returns a new context with the Actor embedded.
func WithActor(ctx context.Context, actor *Actor) context.Context {
	return context.WithValue(ctx, actorKey, actor)
}

// ActorFrom retrieves the Actor from the context if present.
func ActorFrom(ctx context.Context) *Actor {
	actor, ok := ctx.Value(actorKey).(*Actor)
	if !ok {
		return nil
	}
	return actor
}
