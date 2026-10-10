// Command server is the backend composition root. It loads configuration,
// wires the application dependencies and serves the HTTP API.
package main

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"cca/backend/internal/config"
	"cca/backend/internal/httpapi"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("startup: %v", err)
	}

	router := httpapi.NewRouter(httpapi.Deps{})

	addr := ":" + strconv.Itoa(cfg.Port)
	log.Printf("cca/backend listening on %s", addr)

	if err := http.ListenAndServe(addr, router); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("server: %v", err)
	}
}
