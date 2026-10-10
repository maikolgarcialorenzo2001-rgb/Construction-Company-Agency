package httpapi

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"cca/backend/internal/domain"
	"cca/backend/internal/service"
)

// Error codes are stable English snake_case identifiers; messages are the
// es-AR user copy. See design D9 and spec backend-runtime.
const (
	codeInvalidRequest     = "invalid_request"
	msgInvalidRequest      = "Solicitud inválida"
	codeRoleNotAllowed     = "role_not_allowed"
	msgRoleNotAllowed      = "Rol no permitido para el registro"
	codeEmailAlreadyExists = "email_already_exists"
	msgEmailAlreadyExists  = "Ya existe una cuenta con ese email"
	codeInvalidCredentials = "invalid_credentials"
	msgInvalidCredentials  = "Credenciales inválidas"
	codeNotAuthenticated   = "not_authenticated"
	msgNotAuthenticated    = "No autenticado"
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

// writeNotAuthenticated renders the 401 used when a request is not
// authenticated (missing/invalid/expired bearer token or a gone user).
func writeNotAuthenticated(c *gin.Context) {
	writeError(c, http.StatusUnauthorized, codeNotAuthenticated, msgNotAuthenticated)
}

// writeServiceError maps a service sentinel error to the contract error
// envelope. Unrecognized errors fall back to a generic 500.
func writeServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrRoleNotAllowed):
		writeError(c, http.StatusBadRequest, codeRoleNotAllowed, msgRoleNotAllowed)
	case errors.Is(err, service.ErrEmailAlreadyExists):
		writeError(c, http.StatusBadRequest, codeEmailAlreadyExists, msgEmailAlreadyExists)
	case errors.Is(err, service.ErrInvalidCredentials):
		writeError(c, http.StatusUnauthorized, codeInvalidCredentials, msgInvalidCredentials)
	case errors.Is(err, service.ErrNotAuthenticated):
		writeNotAuthenticated(c)
	default:
		writeError(c, http.StatusInternalServerError, "internal_error", "Error interno del servidor")
	}
}
