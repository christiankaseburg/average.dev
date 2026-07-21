package main

import (
	"context"
	"log"
	"os"

	"average.dev/apps/home-api/internal/auth"
	"average.dev/apps/home-api/internal/auth/providers/google"
	"average.dev/apps/home-api/internal/config"
	repoGenerated "average.dev/apps/home-api/internal/repository/generated"
	"average.dev/apps/home-api/internal/server"
	"average.dev/apps/home-api/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Overload()

	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	cfg := config.Load()
	ctx := context.Background()

	providerService := auth.NewProviderService()
	if cfg.GoogleClientID != "" {
		googleProvider, err := google.NewProvider(ctx, cfg)
		if err != nil {
			log.Fatalf("Failed to initialize google provider: %v", err)
		}
		providerService.Register("google", googleProvider)
	}

	dbURL := cfg.DatabaseURL
	if dbURL == "" {
		dbURL = "postgres://postgres:password@localhost:5432/average_dev?sslmode=disable"
	}

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to db: %v", err)
	}
	defer pool.Close()

	repo := repoGenerated.New(pool)
	authSvc := service.NewAuthService(repo, providerService, cfg)

	r := server.New(ctx, providerService, authSvc)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting home-api on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
