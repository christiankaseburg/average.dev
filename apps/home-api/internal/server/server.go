package server

import (
	"context"

	"average.dev/apps/home-api/internal/auth"
	graphqlDriver "average.dev/apps/home-api/internal/driver/graphql"
	graphqlGenerated "average.dev/apps/home-api/internal/driver/graphql/generated"
	"average.dev/apps/home-api/internal/driver/rest"
	"average.dev/apps/home-api/internal/service"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/gin-gonic/gin"
)

func New(ctx context.Context, providerService *auth.ProviderService, authSvc service.AuthService) *gin.Engine {
	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	authHandler := rest.NewAuthHandler(providerService, authSvc, nil) // Config passed as nil if unused, but let's just pass nil since we hardcoded redirect for now. Wait, I'll pass a dummy or we don't need it.

	authGroup := r.Group("/auth")
	{
		authGroup.GET("/login/:provider", authHandler.HandleLogin)
		authGroup.GET("/callback/:provider", authHandler.HandleCallback)
		authGroup.POST("/logout", authHandler.HandleLogout)
		authGroup.GET("/logout", authHandler.HandleLogout)
	}

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// GraphQL setup
	h := handler.NewDefaultServer(graphqlGenerated.NewExecutableSchema(graphqlGenerated.Config{Resolvers: &graphqlDriver.Resolver{
		AuthService: authSvc,
	}}))

	r.POST("/query", func(c *gin.Context) {
		h.ServeHTTP(c.Writer, c.Request)
	})

	r.GET("/", func(c *gin.Context) {
		playground.Handler("GraphQL playground", "/query").ServeHTTP(c.Writer, c.Request)
	})

	return r
}
