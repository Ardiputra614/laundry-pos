package usecase

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/ardiputra/laundry-pos/internal/domain"
	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/ardiputra/laundry-pos/internal/middleware"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrderUsecase struct {
	orderRepo     domain.OrderRepository
	orderItemRepo domain.OrderItemRepository
	trackingRepo  domain.OrderTrackingRepository
	serviceRepo   domain.ServiceRepository
	paymentRepo   domain.PaymentRepository
	settingRepo   domain.CompanySettingRepository
}

func NewOrderUsecase(
	orderRepo domain.OrderRepository,
	orderItemRepo domain.OrderItemRepository,
	trackingRepo domain.OrderTrackingRepository,
	serviceRepo domain.ServiceRepository,
	paymentRepo domain.PaymentRepository,
	settingRepo domain.CompanySettingRepository,
) *OrderUsecase {
	return &OrderUsecase{
		orderRepo:     orderRepo,
		orderItemRepo: orderItemRepo,
		trackingRepo:  trackingRepo,
		serviceRepo:   serviceRepo,
		paymentRepo:   paymentRepo,
		settingRepo:   settingRepo,
	}
}

func (uc *OrderUsecase) CreateOrder(ctx *gin.Context, req dto.CreateOrderRequest) (*dto.OrderResponse, int, error) {
	tenantID := middleware.GetTenantID(ctx)
	companyID := middleware.GetCompanyID(ctx)
	userID := middleware.GetUserID(ctx)

	if tenantID == "" {
		return nil, http.StatusBadRequest, domain.ErrTenantRequired
	}

	invoiceNumber, err := uc.generateInvoiceNumber(tenantID)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}

	now := time.Now()
	order := &domain.Order{
		ID:            uuid.New().String(),
		TenantID:      tenantID,
		CompanyID:     companyID,
		UserID:        userID,
		InvoiceNumber: invoiceNumber,
		Status:        domain.OrderStatusPending,
		OrderType:     req.OrderType,
		ServiceType:   req.ServiceType,
		PaymentStatus: domain.PaymentStatusUnpaid,
		CustomerID:    req.CustomerID,
		Notes:         req.Notes,
	}

	if req.OrderType == "" {
		order.OrderType = "pickup"
	}
	if req.ServiceType == "" {
		order.ServiceType = "regular"
	}

	if req.PickupDate != "" {
		t, err := time.Parse("2006-01-02", req.PickupDate)
		if err == nil {
			order.PickupDate = &t
		}
	}
	if req.DeliveryDate != "" {
		t, err := time.Parse("2006-01-02", req.DeliveryDate)
		if err == nil {
			order.DeliveryDate = &t
		}
	}

	// Get company settings for auto-calculations
	settings, _ := uc.settingRepo.FindByTenant(tenantID)
	discountEnabled := settings != nil && settings.DiscountEnabled
	taxEnabled := settings != nil && settings.TaxEnabled
	defaultTaxRate := float64(0)
	if settings != nil {
		defaultTaxRate = settings.DefaultTaxRate
	}

	var items []domain.OrderItem
	var subtotal float64
	var totalWeight float64
	var totalDiscount float64

	for _, itemReq := range req.Items {
		serviceName := itemReq.ServiceName
		serviceID := itemReq.ServiceID
		unit := itemReq.Unit
		isWeight := false
		discountPercent := float64(0)

		if serviceID == "" && serviceName == "" {
			return nil, http.StatusBadRequest, fmt.Errorf("service_id or service_name is required")
		}

		if serviceID != "" {
			service, err := uc.serviceRepo.FindByID(serviceID)
			if err != nil {
				return nil, http.StatusBadRequest, fmt.Errorf("service %s not found", serviceID)
			}
			if service.TenantID != tenantID {
				return nil, http.StatusBadRequest, fmt.Errorf("service %s not found", serviceID)
			}
			serviceName = service.Name
			if unit == "" {
				unit = service.Unit
			}
			isWeight = service.PriceType == domain.PriceTypeWeight
			discountPercent = service.DiscountPercent
		}

		if unit == "" {
			unit = "kg"
		}

		itemSubtotal := itemReq.Quantity * itemReq.UnitPrice
		itemDiscount := float64(0)
		if discountEnabled && discountPercent > 0 {
			itemDiscount = itemSubtotal * (discountPercent / 100)
		}
		subtotal += itemSubtotal
		totalDiscount += itemDiscount

		if isWeight {
			totalWeight += itemReq.Quantity
		}

		items = append(items, domain.OrderItem{
			ID:          uuid.New().String(),
			TenantID:    tenantID,
			ServiceID:   serviceID,
			ServiceName: serviceName,
			Quantity:    itemReq.Quantity,
			Unit:        unit,
			UnitPrice:   itemReq.UnitPrice,
			Subtotal:    itemSubtotal,
			Notes:       itemReq.Notes,
		})
	}

	netSubtotal := subtotal - totalDiscount
	taxAmount := float64(0)
	if taxEnabled && defaultTaxRate > 0 {
		taxAmount = netSubtotal * (defaultTaxRate / 100)
	}

	order.Subtotal = subtotal
	order.TotalWeight = totalWeight
	order.TotalItems = len(items)
	order.DiscountAmount = totalDiscount
	order.TaxAmount = taxAmount
	order.GrandTotal = netSubtotal + taxAmount
	if order.GrandTotal < 0 {
		order.GrandTotal = 0
	}

	estimatedDone := now.Add(24 * time.Hour)
	order.EstimatedDoneAt = &estimatedDone

	if err := uc.orderRepo.CreateWithItems(order, items); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	uc.trackingRepo.Create(&domain.OrderTracking{
		ID:        uuid.New().String(),
		TenantID:  tenantID,
		OrderID:   order.ID,
		Status:    string(order.Status),
		CreatedBy: userID,
	})

	resp := orderToResponse(order)
	itemResponses := orderItemsToResponse(items)
	resp.Items = itemResponses

	return resp, http.StatusCreated, nil
}

func (uc *OrderUsecase) GetOrder(ctx *gin.Context, id string) (*dto.OrderResponse, int, error) {
	tenantID := middleware.GetTenantID(ctx)

	order, err := uc.orderRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusNotFound, domain.ErrNotFound
		}
		return nil, http.StatusInternalServerError, err
	}

	if order.TenantID != tenantID {
		return nil, http.StatusNotFound, domain.ErrNotFound
	}

	items, err := uc.orderItemRepo.FindByOrderID(order.ID)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}

	resp := orderToResponse(order)
	resp.Items = orderItemsToResponse(items)

	return resp, http.StatusOK, nil
}

func (uc *OrderUsecase) ListOrders(ctx *gin.Context, page, limit int, filters map[string]any) ([]dto.OrderListResponse, int64, error) {
	tenantID := middleware.GetTenantID(ctx)
	if tenantID == "" {
		return nil, 0, domain.ErrTenantRequired
	}

	orders, total, err := uc.orderRepo.FindByTenant(tenantID, page, limit, filters)
	if err != nil {
		return nil, 0, err
	}

	var responses []dto.OrderListResponse
	for _, o := range orders {
		estimated := ""
		if o.EstimatedDoneAt != nil {
			estimated = o.EstimatedDoneAt.Format("2006-01-02T15:04:05Z")
		}
		responses = append(responses, dto.OrderListResponse{
			ID:              o.ID,
			InvoiceNumber:   o.InvoiceNumber,
			CustomerID:      o.CustomerID,
			CustomerName:    "",
			Status:          string(o.Status),
			OrderType:       o.OrderType,
			TotalItems:      o.TotalItems,
			GrandTotal:      o.GrandTotal,
			PaymentStatus:   string(o.PaymentStatus),
			EstimatedDoneAt: estimated,
			CreatedAt:       o.CreatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}

	return responses, total, nil
}

func (uc *OrderUsecase) UpdateStatus(ctx *gin.Context, id string, req dto.UpdateOrderStatusRequest) (*dto.OrderResponse, int, error) {
	tenantID := middleware.GetTenantID(ctx)
	userID := middleware.GetUserID(ctx)

	order, err := uc.orderRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusNotFound, domain.ErrNotFound
		}
		return nil, http.StatusInternalServerError, err
	}

	if order.TenantID != tenantID {
		return nil, http.StatusNotFound, domain.ErrNotFound
	}

	newStatus := domain.OrderStatus(req.Status)
	if err := uc.orderRepo.UpdateStatus(order.ID, newStatus); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	now := time.Now()
	if newStatus == domain.OrderStatusCompleted {
		uc.orderRepo.UpdateFields(order.ID, map[string]any{
			"completed_at": now,
		})
	}

	uc.trackingRepo.Create(&domain.OrderTracking{
		ID:        uuid.New().String(),
		TenantID:  tenantID,
		OrderID:   order.ID,
		Status:    req.Status,
		Note:      req.Note,
		CreatedBy: userID,
	})

	order.Status = newStatus
	resp := orderToResponse(order)

	items, _ := uc.orderItemRepo.FindByOrderID(order.ID)
	resp.Items = orderItemsToResponse(items)

	return resp, http.StatusOK, nil
}

func (uc *OrderUsecase) ProcessPayment(ctx *gin.Context, orderID string, req dto.ProcessPaymentRequest) (*dto.PaymentResponse, int, error) {
	tenantID := middleware.GetTenantID(ctx)
	companyID := middleware.GetCompanyID(ctx)

	order, err := uc.orderRepo.FindByID(orderID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusNotFound, domain.ErrNotFound
		}
		return nil, http.StatusInternalServerError, err
	}

	if order.TenantID != tenantID {
		return nil, http.StatusNotFound, domain.ErrNotFound
	}

	now := time.Now()
	payment := &domain.Payment{
		ID:            uuid.New().String(),
		TenantID:      tenantID,
		CompanyID:     companyID,
		OrderID:       order.ID,
		Amount:        req.Amount,
		PaymentMethod: req.PaymentMethod,
		PaymentChannel: req.PaymentChannel,
		Status:        domain.PaySuccess,
		PaidAt:        &now,
	}

	if err := uc.paymentRepo.Create(payment); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	paidAmount := order.PaidAmount + req.Amount
	updateData := map[string]any{
		"paid_amount":    paidAmount,
		"payment_method": req.PaymentMethod,
	}

	if paidAmount >= order.GrandTotal {
		updateData["payment_status"] = domain.PaymentStatusPaid
		updateData["change_amount"] = paidAmount - order.GrandTotal
	} else {
		updateData["payment_status"] = domain.PaymentStatusPartial
	}

	if err := uc.orderRepo.UpdateFields(order.ID, updateData); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	resp := &dto.PaymentResponse{
		ID:            payment.ID,
		OrderID:       payment.OrderID,
		Amount:        payment.Amount,
		PaymentMethod: payment.PaymentMethod,
		PaymentChannel: payment.PaymentChannel,
		Status:        string(payment.Status),
		PaidAt:        payment.PaidAt.Format("2006-01-02T15:04:05Z"),
		CreatedAt:     payment.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}

	return resp, http.StatusOK, nil
}

func (uc *OrderUsecase) generateInvoiceNumber(tenantID string) (string, error) {
	now := time.Now()
	datePrefix := fmt.Sprintf("INV-%s%02d-", now.Format("2006"), now.Month())

	lastOrder, err := uc.orderRepo.FindLastInvoiceToday(tenantID, datePrefix)
	var seq int
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			seq = 1
		} else {
			return "", err
		}
	} else {
		var lastSeq int
		fmt.Sscanf(lastOrder.InvoiceNumber, datePrefix+"%d", &lastSeq)
		seq = lastSeq + 1
	}

	return fmt.Sprintf("%s%04d", datePrefix, seq), nil
}

func orderToResponse(o *domain.Order) *dto.OrderResponse {
	resp := &dto.OrderResponse{
		ID:             o.ID,
		CustomerID:     o.CustomerID,
		UserID:         o.UserID,
		InvoiceNumber:  o.InvoiceNumber,
		Status:         string(o.Status),
		OrderType:      o.OrderType,
		ServiceType:    o.ServiceType,
		TotalWeight:    o.TotalWeight,
		TotalItems:     o.TotalItems,
		Subtotal:       o.Subtotal,
		DiscountAmount: o.DiscountAmount,
		TaxAmount:      o.TaxAmount,
		GrandTotal:     o.GrandTotal,
		PaidAmount:     o.PaidAmount,
		ChangeAmount:   o.ChangeAmount,
		PaymentStatus:  string(o.PaymentStatus),
		PaymentMethod:  o.PaymentMethod,
		Notes:          o.Notes,
		CreatedAt:      o.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:      o.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}

	if o.PickupDate != nil {
		resp.PickupDate = o.PickupDate.Format("2006-01-02")
	}
	if o.DeliveryDate != nil {
		resp.DeliveryDate = o.DeliveryDate.Format("2006-01-02")
	}
	if o.EstimatedDoneAt != nil {
		resp.EstimatedDoneAt = o.EstimatedDoneAt.Format("2006-01-02T15:04:05Z")
	}
	if o.CompletedAt != nil {
		resp.CompletedAt = o.CompletedAt.Format("2006-01-02T15:04:05Z")
	}

	return resp
}

func orderItemsToResponse(items []domain.OrderItem) []dto.OrderItemResponse {
	var responses []dto.OrderItemResponse
	for _, item := range items {
		responses = append(responses, dto.OrderItemResponse{
			ID:          item.ID,
			ServiceID:   item.ServiceID,
			ServiceName: item.ServiceName,
			Quantity:    item.Quantity,
			Unit:        item.Unit,
			UnitPrice:   item.UnitPrice,
			Subtotal:    item.Subtotal,
			Notes:       item.Notes,
		})
	}
	return responses
}
