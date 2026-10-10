package httpapi

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"cca/backend/internal/domain"
	"cca/backend/internal/service"
)

// registerRequest is the POST /auth/register body per contracts/openapi.yaml.
type registerRequest struct {
	Email    string      `json:"email" binding:"required,email"`
	Password string      `json:"password" binding:"required"`
	Role     domain.Role `json:"role" binding:"required"`
}

// register handles POST /auth/register: bind, delegate to the service, and
// translate the result into the contract response.
func register(svc *service.Auth) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req registerRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			writeInvalidRequest(c)
			return
		}

		result, err := svc.Register(c.Request.Context(), req.Email, req.Password, req.Role)
		if err != nil {
			writeServiceError(c, err)
			return
		}

		c.JSON(http.StatusCreated, gin.H{"userId": result.UserID, "token": result.Token})
	}
}
