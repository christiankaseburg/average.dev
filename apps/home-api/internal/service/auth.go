package service

import (
	"context"
	"fmt"
	"time"

	"average.dev/apps/home-api/internal/auth"
	"average.dev/apps/home-api/internal/config"
	"average.dev/apps/home-api/internal/driver/graphql/model"
	repoGenerated "average.dev/apps/home-api/internal/repository/generated"

	"github.com/golang-jwt/jwt/v5"
)

type AuthService interface {
	HandleCallback(ctx context.Context, providerName string, code string) (string, error)
	GetMe(ctx context.Context) (*model.User, error)
}

type authService struct {
	repo            repoGenerated.Querier
	providerService *auth.ProviderService
	cfg             *config.Config
}

func NewAuthService(repo repoGenerated.Querier, providerService *auth.ProviderService, cfg *config.Config) AuthService {
	return &authService{
		repo:            repo,
		providerService: providerService,
		cfg:             cfg,
	}
}

func (s *authService) HandleCallback(ctx context.Context, providerName string, code string) (string, error) {
	provider, ok := s.providerService.Get(providerName)
	if !ok {
		return "", fmt.Errorf("google provider not found")
	}

	token, err := provider.Exchange(ctx, code)
	if err != nil {
		return "", fmt.Errorf("failed to exchange code: %w", err)
	}

	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok {
		return "", fmt.Errorf("missing id_token")
	}

	claims, err := provider.ValidateToken(ctx, rawIDToken)
	if err != nil {
		return "", fmt.Errorf("failed to validate token: %w", err)
	}

	ssoIdent, err := s.repo.GetIdentity(ctx, repoGenerated.GetIdentityParams{
		Provider:   claims.Provider,
		ProviderID: claims.ProviderID,
	})

	var userID int64
	if err != nil { 
		// User/identity does not exist
		user, err := s.repo.GetUserByEmail(ctx, claims.Email)
		if err != nil {
			user, err = s.repo.CreateUser(ctx, repoGenerated.CreateUserParams{
				Name:         claims.Name,
				PrimaryEmail: claims.Email,
				Role:         "USER",
			})
			if err != nil {
				return "", fmt.Errorf("failed to create user: %w", err)
			}
		}
		userID = user.ID

		_, err = s.repo.CreateIdentity(ctx, repoGenerated.CreateIdentityParams{
			UserID:     user.ID,
			Provider:   claims.Provider,
			ProviderID: claims.ProviderID,
			Email:      claims.Email,
		})
		if err != nil {
			return "", fmt.Errorf("failed to create identity: %w", err)
		}
	} else {
		userID = ssoIdent.UserID
	}

	uidStr := fmt.Sprintf("%d", userID)

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      uidStr,
		"email":    claims.Email,
		"name":     claims.Name,
		"provider": "google",
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
	})

	secret := []byte("hardcoded-jwt-secret-for-dev")
	if s.cfg.JWTSecret != "" {
		secret = []byte(s.cfg.JWTSecret)
	}

	signed, err := jwtToken.SignedString(secret)
	if err != nil {
		return "", fmt.Errorf("failed to sign jwt: %w", err)
	}

	return signed, nil
}

func (s *authService) GetMe(ctx context.Context) (*model.User, error) {
	// Stub for now, read from context later
	return &model.User{
		ID:    "1",
		Email: "stub@example.com",
	}, nil
}
