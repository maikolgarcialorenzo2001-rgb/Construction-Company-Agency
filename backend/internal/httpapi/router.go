// Package httpapi wires the Gin router and the thin HTTP handlers.
package httpapi

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Deps carries the collaborators the HTTP layer needs. It grows as the auth
// service and other resource services land.
type Deps struct{}

// NewRouter builds the Gin engine with every registered route.
func NewRouter(_ Deps) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())

	r.GET("/health", health)

	return r
}

// health is the operational liveness endpoint. It is intentionally absent from
// contracts/openapi.yaml.
func health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
