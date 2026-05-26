package handler

import (
	"net/http"

	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/ardiputra/laundry-pos/internal/pkg/response"
	"github.com/ardiputra/laundry-pos/internal/usecase"
	"github.com/gin-gonic/gin"
)

type SettingsHandler struct {
	settingsUsecase *usecase.SettingsUsecase
}

func NewSettingsHandler(settingsUsecase *usecase.SettingsUsecase) *SettingsHandler {
	return &SettingsHandler{settingsUsecase: settingsUsecase}
}

func (h *SettingsHandler) GetSettings(c *gin.Context) {
	resp, statusCode, err := h.settingsUsecase.GetSettings(c)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}
	response.OK(c, "settings retrieved", resp)
}

func (h *SettingsHandler) UpdateSettings(c *gin.Context) {
	var req dto.UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.settingsUsecase.UpdateSettings(c, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}
	response.OK(c, "settings updated", resp)
}
