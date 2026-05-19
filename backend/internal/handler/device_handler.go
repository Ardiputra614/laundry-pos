package handler

import (
	"net/http"

	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/ardiputra/laundry-pos/internal/pkg/response"
	"github.com/ardiputra/laundry-pos/internal/usecase"
	"github.com/gin-gonic/gin"
)

type DeviceHandler struct {
	deviceUsecase *usecase.DeviceUsecase
}

func NewDeviceHandler(deviceUsecase *usecase.DeviceUsecase) *DeviceHandler {
	return &DeviceHandler{deviceUsecase: deviceUsecase}
}

func (h *DeviceHandler) Register(c *gin.Context) {
	var req dto.RegisterDeviceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.deviceUsecase.Register(c, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.Created(c, "device registered", resp)
}

func (h *DeviceHandler) List(c *gin.Context) {
	devices, err := h.deviceUsecase.ListByCompany(c)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.OK(c, "devices retrieved", devices)
}

func (h *DeviceHandler) Deactivate(c *gin.Context) {
	id := c.Param("id")

	resp, statusCode, err := h.deviceUsecase.Deactivate(c, id)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "device deactivated", resp)
}
