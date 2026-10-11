// Package config loads the backend runtime configuration from the environment.
//
// Secrets are never hardcoded: JWT_SECRET is required and startup fails fast
// when it is missing or when a supplied value is invalid.
package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

const (
	defaultPort = 8080
	defaultTTL  = 24 * time.Hour
)

// Config is the resolved runtime configuration for the backend server.
type Config struct {
	// Port is the TCP port the HTTP server listens on (PORT, default 8080).
	Port int
	// JWTSecret signs and verifies bearer tokens (JWT_SECRET, required).
	JWTSecret string
	// ContractPath optionally overrides the resolved openapi.yaml location
	// (CONTRACT_PATH). Empty means "use the module-relative default".
	ContractPath string
	// TokenTTL is the lifetime of issued JWTs (TOKEN_TTL, default 24h).
	TokenTTL time.Duration
	// DatabaseURL optionally selects the PostgreSQL adapter (DATABASE_URL).
	// Empty means the in-memory store is used.
	DatabaseURL string
}

// Load reads configuration from the environment, applying defaults and
// validating required values. It returns a clear error instead of panicking so
// the composition root can fail startup before opening a listener.
func Load() (Config, error) {
	cfg := Config{
		Port:     defaultPort,
		TokenTTL: defaultTTL,
	}

	if raw := os.Getenv("PORT"); raw != "" {
		port, err := strconv.Atoi(raw)
		if err != nil || port < 1 || port > 65535 {
			return Config{}, fmt.Errorf("config: PORT=%q is invalid, want an integer between 1 and 65535", raw)
		}
		cfg.Port = port
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return Config{}, fmt.Errorf("config: JWT_SECRET is required and was not set")
	}
	cfg.JWTSecret = secret

	cfg.ContractPath = os.Getenv("CONTRACT_PATH")

	if raw := os.Getenv("TOKEN_TTL"); raw != "" {
		ttl, err := time.ParseDuration(raw)
		if err != nil {
			return Config{}, fmt.Errorf("config: TOKEN_TTL=%q is invalid: %w", raw, err)
		}
		if ttl <= 0 {
			return Config{}, fmt.Errorf("config: TOKEN_TTL=%q must be positive", raw)
		}
		cfg.TokenTTL = ttl
	}

	cfg.DatabaseURL = os.Getenv("DATABASE_URL")

	return cfg, nil
}
