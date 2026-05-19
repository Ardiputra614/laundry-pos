package handler

import (
	"strconv"

	"github.com/ardiputra/laundry-pos/internal/pkg/response"
	"github.com/ardiputra/laundry-pos/internal/usecase"
	"github.com/gin-gonic/gin"
)

type SuperadminHandler struct {
	superadminUsecase *usecase.SuperadminUsecase
}

func NewSuperadminHandler(superadminUsecase *usecase.SuperadminUsecase) *SuperadminHandler {
	return &SuperadminHandler{superadminUsecase: superadminUsecase}
}

func (h *SuperadminHandler) ListCompanies(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")
	plan := c.Query("plan")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	companies, total, statusCode, err := h.superadminUsecase.ListCompanies(c, page, limit, status, plan)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.Paginated(c, "companies retrieved", companies, page, limit, total)
}

func (h *SuperadminHandler) GetCompanyDetail(c *gin.Context) {
	id := c.Param("id")

	resp, statusCode, err := h.superadminUsecase.GetCompanyDetail(c, id)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "company detail retrieved", resp)
}

func (h *SuperadminHandler) SuspendCompany(c *gin.Context) {
	id := c.Param("id")

	statusCode, err := h.superadminUsecase.SuspendCompany(c, id)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "company suspended", nil)
}

func (h *SuperadminHandler) ActivateCompany(c *gin.Context) {
	id := c.Param("id")

	statusCode, err := h.superadminUsecase.ActivateCompany(c, id)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "company activated", nil)
}

func (h *SuperadminHandler) GetDashboardStats(c *gin.Context) {
	stats, statusCode, err := h.superadminUsecase.GetDashboardStats(c)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "dashboard stats retrieved", stats)
}

func (h *SuperadminHandler) GetSystemHealth(c *gin.Context) {
	health, statusCode, err := h.superadminUsecase.GetSystemHealth(c)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "system health retrieved", health)
}
