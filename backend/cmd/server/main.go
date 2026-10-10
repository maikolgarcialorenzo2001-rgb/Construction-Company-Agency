// Command server is the backend composition root. It loads configuration,
// wires the application dependencies and serves the HTTP API.
package main

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"cca/backend/internal/auth"
	"cca/backend/internal/config"
	"cca/backend/internal/httpapi"
	"cca/backend/internal/service"
	"cca/backend/internal/store/memory"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("startup: %v", err)
	}

	issuer := auth.NewJWT(cfg.JWTSecret, cfg.TokenTTL)
	users := memory.NewUserStore()
	authService := service.NewAuth(users, issuer, auth.Bcrypt{})

	router := httpapi.NewRouter(httpapi.Deps{Auth: authService, Tokens: issuer})

	addr := ":" + strconv.Itoa(cfg.Port)
	log.Printf("cca/backend listening on %s", addr)

	if err := http.ListenAndServe(addr, router); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("server: %v", err)
	}
}
