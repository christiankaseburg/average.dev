package config

import (
	"os"
)

type Config struct {
	GoogleIssuer       string
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURI  string
	JWTSecret          string
	DatabaseURL        string
}

func Load() *Config {
	return &Config{
		GoogleIssuer:       os.Getenv("GOOGLE_ISSUER"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURI:  os.Getenv("GOOGLE_REDIRECT_URI"),
		JWTSecret:          os.Getenv("JWT_SECRET"),
		DatabaseURL:        os.Getenv("DATABASE_URL"),
	}
}
