package usecase

import (
	"time"

	"github.com/ardiputra/laundry-pos/internal/domain"
	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/ardiputra/laundry-pos/internal/middleware"
	"github.com/gin-gonic/gin"
)

type ReportUsecase struct {
	orderRepo     domain.OrderRepository
	orderItemRepo domain.OrderItemRepository
}

func NewReportUsecase(orderRepo domain.OrderRepository, orderItemRepo domain.OrderItemRepository) *ReportUsecase {
	return &ReportUsecase{orderRepo: orderRepo, orderItemRepo: orderItemRepo}
}

func (uc *ReportUsecase) GetReport(ctx *gin.Context, startDate, endDate string) (*dto.ReportResponse, error) {
	tenantID := middleware.GetTenantID(ctx)
	if tenantID == "" {
		return nil, domain.ErrTenantRequired
	}

	if startDate == "" {
		startDate = time.Now().Format("2006-01-02")
	}
	if endDate == "" {
		endDate = time.Now().Format("2006-01-02")
	}

	filters := map[string]any{
		"start_date": startDate + " 00:00:00",
		"end_date":   endDate + " 23:59:59",
	}

	orders, _, err := uc.orderRepo.FindByTenant(tenantID, 1, 100000, filters)
	if err != nil {
		return nil, err
	}

	totalOrders := len(orders)
	var totalRevenue, totalDiscount, totalTax float64

	for _, o := range orders {
		totalRevenue += o.GrandTotal
		totalDiscount += o.DiscountAmount
		totalTax += o.TaxAmount
	}

	start, _ := time.Parse("2006-01-02", startDate)
	end, _ := time.Parse("2006-01-02", endDate)
	days := int(end.Sub(start).Hours()/24) + 1
	if days < 1 {
		days = 1
	}
	avgPerDay := float64(totalOrders) / float64(days)
	netRevenue := totalRevenue - totalDiscount + totalTax

	serviceUsage := uc.aggregateServiceUsage(orders)

	return &dto.ReportResponse{
		TotalOrders:    totalOrders,
		TotalRevenue:   totalRevenue,
		TotalDiscount:  totalDiscount,
		TotalTax:       totalTax,
		NetRevenue:     netRevenue,
		AvgPerDay:      avgPerDay,
		StartDate:      startDate,
		EndDate:        endDate,
		ServiceUsage:   serviceUsage,
		OrdersByStatus: uc.aggregateByStatus(orders),
	}, nil
}

func (uc *ReportUsecase) aggregateServiceUsage(orders []domain.Order) []dto.ServiceUsageItem {
	usageMap := make(map[string]*dto.ServiceUsageItem)
	var orderIDs []string

	for _, o := range orders {
		orderIDs = append(orderIDs, o.ID)
	}

	items, err := uc.orderItemRepo.FindByOrderIDs(orderIDs)
	if err != nil || len(items) == 0 {
		return nil
	}

	var result []dto.ServiceUsageItem
	for _, item := range items {
		name := item.ServiceName
		if name == "" {
			name = "(tanpa nama)"
		}
		if existing, ok := usageMap[name]; ok {
			existing.Count++
			existing.Revenue += item.Subtotal
		} else {
			usageMap[name] = &dto.ServiceUsageItem{
				ServiceName: name,
				Count:       1,
				Revenue:     item.Subtotal,
			}
		}
	}

	for _, v := range usageMap {
		result = append(result, *v)
	}

	return result
}

func (uc *ReportUsecase) aggregateByStatus(orders []domain.Order) map[string]int {
	statusMap := make(map[string]int)
	for _, o := range orders {
		statusMap[string(o.Status)]++
	}
	return statusMap
}
