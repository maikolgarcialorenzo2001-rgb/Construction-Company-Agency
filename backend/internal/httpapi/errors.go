package httpapi

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"cca/backend/internal/domain"
)

// Error codes are stable English snake_case identifiers; messages are the
// es-AR user copy. See design D9 and spec backend-runtime.
const (
	codeInvalidRequest = "invalid_request"
	msgInvalidRequest  = "Solicitud inválida"
)

// writeError renders a contract-shaped error body and stops the handler chain.
func writeError(c *gin.Context, status int, code, message string) {
	c.AbortWithStatusJSON(status, domain.Error{Code: code, Message: message})
}

// writeInvalidRequest renders the generic 400 used for malformed or
// schema-invalid JSON request bodies.
func writeInvalidRequest(c *gin.Context) {
	writeError(c, http.StatusBadRequest, codeInvalidRequest, msgInvalidRequest)
}
