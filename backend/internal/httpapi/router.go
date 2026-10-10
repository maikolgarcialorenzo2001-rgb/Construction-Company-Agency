// Package httpapi wires the Gin router and the thin HTTP handlers.
package httpapi

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"cca/backend/internal/auth"
	"cca/backend/internal/service"
)

// Deps carries the collaborators the HTTP layer needs. It grows as the auth
// service and other resource services land.
type Deps struct {
	// Auth is the authentication application service backing the auth routes.
	Auth *service.Auth
	// Tokens verifies bearer tokens for the protected routes.
	Tokens auth.Issuer
}

// NewRouter builds the Gin engine with every registered route.
func NewRouter(deps Deps) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())

	r.GET("/health", health)

	r.POST("/auth/register", register(deps.Auth))
	r.POST("/auth/login", login(deps.Auth))
	r.GET("/auth/me", RequireAuth(deps.Tokens), me(deps.Auth))

	return r
}

// health is the operational liveness endpoint. It is intentionally absent from
// contracts/openapi.yaml.
func health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
