package handler

import (
	"net/http"

	"github.com/ardiputra/laundry-pos/internal/pkg/response"
	"github.com/ardiputra/laundry-pos/internal/usecase"
	"github.com/gin-gonic/gin"
)

type ReportHandler struct {
	reportUsecase *usecase.ReportUsecase
}

func NewReportHandler(reportUsecase *usecase.ReportUsecase) *ReportHandler {
	return &ReportHandler{reportUsecase: reportUsecase}
}

func (h *ReportHandler) GetReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	resp, err := h.reportUsecase.GetReport(c, startDate, endDate)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.OK(c, "report retrieved", resp)
}
