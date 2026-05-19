package handler

import (
	"net/http"
	"strconv"

	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/ardiputra/laundry-pos/internal/pkg/response"
	"github.com/ardiputra/laundry-pos/internal/usecase"
	"github.com/gin-gonic/gin"
)

type EmployeeHandler struct {
	employeeUsecase *usecase.EmployeeUsecase
}

func NewEmployeeHandler(employeeUsecase *usecase.EmployeeUsecase) *EmployeeHandler {
	return &EmployeeHandler{employeeUsecase: employeeUsecase}
}

func (h *EmployeeHandler) Create(c *gin.Context) {
	var req dto.CreateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.employeeUsecase.Create(c, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.Created(c, "employee created", resp)
}

func (h *EmployeeHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req dto.UpdateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.employeeUsecase.Update(c, id, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "employee updated", resp)
}

func (h *EmployeeHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	resp, err := h.employeeUsecase.GetByID(c, id)
	if err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}

	response.OK(c, "employee retrieved", resp)
}

func (h *EmployeeHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	employees, total, err := h.employeeUsecase.ListByCompany(c, page, limit)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Paginated(c, "employees retrieved", employees, page, limit, total)
}

func (h *EmployeeHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := h.employeeUsecase.Delete(c, id); err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}

	response.OK(c, "employee deleted", nil)
}
