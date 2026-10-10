package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"

	"cca/backend/internal/service"
)

// loginRequest is the POST /auth/login body per contracts/openapi.yaml. The
// contract forbids additional properties, so the body is decoded strictly.
type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// login handles POST /auth/login: strict-bind, delegate, and translate.
func login(svc *service.Auth) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req loginRequest
		dec := json.NewDecoder(c.Request.Body)
		dec.DisallowUnknownFields()
		if err := dec.Decode(&req); err != nil {
			writeInvalidRequest(c)
			return
		}
		if err := binding.Validator.ValidateStruct(&req); err != nil {
			writeInvalidRequest(c)
			return
		}

		result, err := svc.Login(c.Request.Context(), req.Email, req.Password)
		if err != nil {
			writeServiceError(c, err)
			return
		}

		c.JSON(http.StatusOK, gin.H{"token": result.Token, "role": result.Role})
	}
}
