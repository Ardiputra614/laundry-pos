package handler

import (
	"net/http"
	"strconv"

	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/ardiputra/laundry-pos/internal/pkg/response"
	"github.com/ardiputra/laundry-pos/internal/usecase"
	"github.com/gin-gonic/gin"
)

type ServiceHandler struct {
	serviceUsecase *usecase.ServiceUsecase
}

func NewServiceHandler(serviceUsecase *usecase.ServiceUsecase) *ServiceHandler {
	return &ServiceHandler{serviceUsecase: serviceUsecase}
}

func (h *ServiceHandler) CreateCategory(c *gin.Context) {
	var req dto.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.serviceUsecase.CreateCategory(c, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.Created(c, "category created", resp)
}

func (h *ServiceHandler) ListCategories(c *gin.Context) {
	categories, err := h.serviceUsecase.ListCategories(c)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.OK(c, "categories retrieved", categories)
}

func (h *ServiceHandler) CreateService(c *gin.Context) {
	var req dto.CreateServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.serviceUsecase.CreateService(c, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.Created(c, "service created", resp)
}

func (h *ServiceHandler) ListServices(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	services, total, err := h.serviceUsecase.ListServices(c, page, limit)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Paginated(c, "services retrieved", services, page, limit, total)
}

func (h *ServiceHandler) UpdateService(c *gin.Context) {
	id := c.Param("id")

	var req dto.UpdateServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.serviceUsecase.UpdateService(c, id, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "service updated", resp)
}

func (h *ServiceHandler) DeleteService(c *gin.Context) {
	id := c.Param("id")

	statusCode, err := h.serviceUsecase.DeleteService(c, id)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "service deleted", nil)
}
