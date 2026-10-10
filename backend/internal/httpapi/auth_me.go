package httpapi

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"cca/backend/internal/service"
)

// meResponse is the GET /auth/me body per contracts/openapi.yaml.
type meResponse struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	Role   string `json:"role"`
}

// me handles GET /auth/me. RequireAuth has already verified the token and set
// the identity on the context.
func me(svc *service.Auth) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString(CtxUserID)
		if userID == "" {
			writeNotAuthenticated(c)
			return
		}

		result, err := svc.Me(c.Request.Context(), userID)
		if err != nil {
			writeServiceError(c, err)
			return
		}

		c.JSON(http.StatusOK, meResponse{
			UserID: result.UserID,
			Email:  result.Email,
			Role:   string(result.Role),
		})
	}
}
