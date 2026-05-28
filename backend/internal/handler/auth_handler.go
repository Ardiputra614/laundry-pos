package handler

import (
	"log"
	"net/http"

	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/ardiputra/laundry-pos/internal/middleware"
	"github.com/ardiputra/laundry-pos/internal/pkg/response"
	"github.com/ardiputra/laundry-pos/internal/usecase"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authUsecase *usecase.AuthUsecase
}

func NewAuthHandler(authUsecase *usecase.AuthUsecase) *AuthHandler {
	return &AuthHandler{authUsecase: authUsecase}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[Auth.Register] bind json error: %v", err)
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	log.Printf("[Auth.Register] request: email=%s, full_name=%s", req.Email, req.FullName)

	resp, statusCode, err := h.authUsecase.Register(c, req)
	if err != nil {
		log.Printf("[Auth.Register] usecase error (status %d): %v", statusCode, err)
		response.Error(c, statusCode, err.Error())
		return
	}

	log.Printf("[Auth.Register] success: user_id=%s", resp.User.ID)
	response.Created(c, "registration successful", resp)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.authUsecase.Login(c, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "login successful", resp)
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req dto.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.authUsecase.RefreshToken(c, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "token refreshed", resp)
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	statusCode, err := h.authUsecase.ChangePassword(c, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "password changed successfully, please login again", nil)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	if err := h.authUsecase.Logout(c); err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.OK(c, "logout successful", nil)
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	user, statusCode, err := h.authUsecase.UpdateProfile(c, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "profile updated", user)
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	user, err := h.authUsecase.GetProfile(c)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.OK(c, "profile retrieved", user)
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	claims := middleware.GetClaims(c)
	if claims == nil {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	response.OK(c, "token info", gin.H{
		"user_id":    claims.UserID,
		"tenant_id":  claims.TenantID,
		"company_id": claims.CompanyID,
		"role":       claims.Role,
		"email":      claims.Email,
	})
}
