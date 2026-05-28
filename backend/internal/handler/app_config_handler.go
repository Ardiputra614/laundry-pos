package handler

import (
	"net/http"

	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/ardiputra/laundry-pos/internal/pkg/response"
	"github.com/ardiputra/laundry-pos/internal/usecase"
	"github.com/gin-gonic/gin"
)

type AppConfigHandler struct {
	configUsecase *usecase.AppConfigUsecase
}

func NewAppConfigHandler(configUsecase *usecase.AppConfigUsecase) *AppConfigHandler {
	return &AppConfigHandler{configUsecase: configUsecase}
}

func (h *AppConfigHandler) GetConfig(c *gin.Context) {
	config, statusCode, err := h.configUsecase.GetConfig()
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}
	response.OK(c, "app config retrieved", config)
}

func (h *AppConfigHandler) UpdateConfig(c *gin.Context) {
	var req dto.UpdateAppConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	config, statusCode, err := h.configUsecase.UpdateConfig(req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "app config updated", config)
}
