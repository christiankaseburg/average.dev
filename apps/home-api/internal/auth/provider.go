package auth

import (
	"context"
	"fmt"
)

// ProviderService handles multiple authentication providers.
type ProviderService struct {
	providers map[string]Provider
}

// NewProviderService creates a new Auth ProviderService.
func NewProviderService() *ProviderService {
	return &ProviderService{
		providers: make(map[string]Provider),
	}
}

// Register adds a provider to the service.
func (s *ProviderService) Register(name string, p Provider) {
	s.providers[name] = p
}

// Get retrieves a provider by name.
func (s *ProviderService) Get(name string) (Provider, bool) {
	p, ok := s.providers[name]
	return p, ok
}

// ValidateToken attempts to validate the token against all registered providers.
func (s *ProviderService) ValidateToken(ctx context.Context, token string) (*IdentityClaims, error) {
	var lastErr error
	for name, p := range s.providers {
		claims, err := p.ValidateToken(ctx, token)
		if err == nil {
			return claims, nil
		}
		lastErr = fmt.Errorf("provider %s failed: %w", name, err)
	}
	if lastErr != nil {
		return nil, lastErr
	}
	return nil, fmt.Errorf("no providers configured")
}
