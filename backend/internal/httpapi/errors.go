package httpapi

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Error codes are stable English snake_case identifiers; messages are the
// es-AR user copy. See design D9 and spec backend-runtime.
const (
	codeInvalidRequest = "invalid_request"
	msgInvalidRequest  = "Solicitud inválida"
)

// errorEnvelope is the contract Error shape {code, message, details?} with no
// additional top-level properties.
type errorEnvelope struct {
	Code    string         `json:"code"`
	Message string         `json:"message"`
	Details map[string]any `json:"details,omitempty"`
}

// writeError renders a contract-shaped error body and stops the handler chain.
func writeError(c *gin.Context, status int, code, message string) {
	c.AbortWithStatusJSON(status, errorEnvelope{Code: code, Message: message})
}

// writeInvalidRequest renders the generic 400 used for malformed or
// schema-invalid JSON request bodies.
func writeInvalidRequest(c *gin.Context) {
	writeError(c, http.StatusBadRequest, codeInvalidRequest, msgInvalidRequest)
}
