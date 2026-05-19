package usecase

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/ardiputra/laundry-pos/internal/domain"
	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/ardiputra/laundry-pos/internal/middleware"
	"github.com/ardiputra/laundry-pos/internal/pkg/midtrans"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SubscriptionUsecase struct {
	planRepo    domain.SubscriptionPlanRepository
	subRepo     domain.SubscriptionRepository
	invoiceRepo domain.InvoiceRepository
	companyRepo domain.CompanyRepository
	midtrans    *midtrans.Client
}

func NewSubscriptionUsecase(
	planRepo domain.SubscriptionPlanRepository,
	subRepo domain.SubscriptionRepository,
	invoiceRepo domain.InvoiceRepository,
	companyRepo domain.CompanyRepository,
	midtransClient *midtrans.Client,
) *SubscriptionUsecase {
	return &SubscriptionUsecase{
		planRepo:    planRepo,
		subRepo:     subRepo,
		invoiceRepo: invoiceRepo,
		companyRepo: companyRepo,
		midtrans:    midtransClient,
	}
}

// Superadmin: create a subscription plan
func (uc *SubscriptionUsecase) CreatePlan(ctx *gin.Context, req dto.CreatePlanRequest) (*dto.PlanResponse, int, error) {
	existing, err := uc.planRepo.FindByCode(req.Code)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, http.StatusInternalServerError, err
	}
	if existing != nil {
		return nil, http.StatusConflict, domain.ErrConflict
	}

	featuresJSON, err := json.Marshal(req.Features)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	plan := &domain.SubscriptionPlan{
		ID:           uuid.New().String(),
		Name:         req.Name,
		Code:         req.Code,
		Description:  req.Description,
		PriceMonthly: req.PriceMonthly,
		PriceYearly:  req.PriceYearly,
		MaxUsers:     req.MaxUsers,
		MaxBranches:  req.MaxBranches,
		MaxOutlets:   req.MaxOutlets,
		Features:     string(featuresJSON),
		IsActive:     isActive,
		SortOrder:    req.SortOrder,
	}

	if err := uc.planRepo.Create(plan); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	resp := toPlanResponse(plan)
	return resp, http.StatusCreated, nil
}

// Superadmin: update a subscription plan
func (uc *SubscriptionUsecase) UpdatePlan(ctx *gin.Context, id string, req dto.UpdatePlanRequest) (*dto.PlanResponse, int, error) {
	plan, err := uc.planRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusNotFound, domain.ErrNotFound
		}
		return nil, http.StatusInternalServerError, err
	}

	if req.Name != nil {
		plan.Name = *req.Name
	}
	if req.Description != nil {
		plan.Description = *req.Description
	}
	if req.PriceMonthly != nil {
		plan.PriceMonthly = *req.PriceMonthly
	}
	if req.PriceYearly != nil {
		plan.PriceYearly = *req.PriceYearly
	}
	if req.MaxUsers != nil {
		plan.MaxUsers = *req.MaxUsers
	}
	if req.MaxBranches != nil {
		plan.MaxBranches = *req.MaxBranches
	}
	if req.MaxOutlets != nil {
		plan.MaxOutlets = *req.MaxOutlets
	}
	if req.SortOrder != nil {
		plan.SortOrder = *req.SortOrder
	}
	if req.IsActive != nil {
		plan.IsActive = *req.IsActive
	}
	if req.Features != nil {
		featuresJSON, err := json.Marshal(req.Features)
		if err != nil {
			return nil, http.StatusInternalServerError, err
		}
		plan.Features = string(featuresJSON)
	}

	if err := uc.planRepo.Update(plan); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	resp := toPlanResponse(plan)
	return resp, http.StatusOK, nil
}

// Superadmin: delete a subscription plan
func (uc *SubscriptionUsecase) DeletePlan(ctx *gin.Context, id string) (int, error) {
	_, err := uc.planRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, domain.ErrNotFound
		}
		return http.StatusInternalServerError, err
	}

	if err := uc.planRepo.Delete(id); err != nil {
		return http.StatusInternalServerError, err
	}

	return http.StatusOK, nil
}

// Superadmin: list all plans
func (uc *SubscriptionUsecase) ListPlans(ctx *gin.Context) ([]dto.PlanResponse, error) {
	plans, err := uc.planRepo.FindAll()
	if err != nil {
		return nil, err
	}

	var responses []dto.PlanResponse
	for _, p := range plans {
		responses = append(responses, *toPlanResponse(&p))
	}
	return responses, nil
}

// Public: list only active plans
func (uc *SubscriptionUsecase) ListActivePlans(ctx *gin.Context) ([]dto.PlanResponse, error) {
	plans, err := uc.planRepo.FindActive()
	if err != nil {
		return nil, err
	}

	var responses []dto.PlanResponse
	for _, p := range plans {
		responses = append(responses, *toPlanResponse(&p))
	}
	return responses, nil
}

// Get subscription for the current company
func (uc *SubscriptionUsecase) GetCompanySubscription(ctx *gin.Context) (*dto.SubscriptionResponse, int, error) {
	companyID := middleware.GetCompanyID(ctx)
	if companyID == "" {
		return nil, http.StatusBadRequest, domain.ErrTenantRequired
	}

	sub, err := uc.subRepo.FindByCompany(companyID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusNotFound, domain.ErrNotFound
		}
		return nil, http.StatusInternalServerError, err
	}

	plan, err := uc.planRepo.FindByID(sub.PlanID)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}

	resp := toSubscriptionResponse(sub, plan)
	return resp, http.StatusOK, nil
}

// Change company's plan (superadmin or company admin)
func (uc *SubscriptionUsecase) ChangePlan(ctx *gin.Context, req dto.ChangePlanRequest) (*dto.SubscriptionResponse, int, error) {
	companyID := middleware.GetCompanyID(ctx)
	if companyID == "" {
		return nil, http.StatusBadRequest, domain.ErrTenantRequired
	}

	plan, err := uc.planRepo.FindByID(req.PlanID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusNotFound, domain.ErrNotFound
		}
		return nil, http.StatusInternalServerError, err
	}

	if !plan.IsActive {
		return nil, http.StatusBadRequest, errors.New("plan is not active")
	}

	sub, err := uc.subRepo.FindByCompany(companyID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusNotFound, domain.ErrNotFound
		}
		return nil, http.StatusInternalServerError, err
	}

	billingCycle := req.BillingCycle
	if billingCycle == "" {
		billingCycle = "monthly"
	}

	now := time.Now()
	amount := plan.PriceMonthly
	if billingCycle == "yearly" {
		amount = plan.PriceYearly
	}

	sub.PlanID = plan.ID
	sub.Amount = amount
	sub.BillingCycle = billingCycle
	sub.Status = string(domain.SubActive)
	sub.CurrentPeriodStart = &now
	periodEnd := now.AddDate(0, 1, 0)
	if billingCycle == "yearly" {
		periodEnd = now.AddDate(1, 0, 0)
	}
	sub.CurrentPeriodEnd = &periodEnd

	if err := uc.subRepo.Update(sub); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	company, err := uc.companyRepo.FindByID(companyID)
	if err == nil {
		company.Plan = domain.PlanType(plan.Code)
		company.SubStatus = domain.SubActive
		company.MaxUsers = plan.MaxUsers
		company.MaxBranches = plan.MaxBranches
		company.SubExpiresAt = sub.CurrentPeriodEnd
		uc.companyRepo.Update(company)
	}

	resp := toSubscriptionResponse(sub, plan)
	return resp, http.StatusOK, nil
}

// Company admin: select a plan (creates/updates subscription as pending, no payment)
func (uc *SubscriptionUsecase) SelectPlan(ctx *gin.Context, req dto.ChangePlanRequest) (*dto.SubscriptionResponse, int, error) {
	companyID := middleware.GetCompanyID(ctx)
	tenantID := middleware.GetTenantID(ctx)
	if companyID == "" || tenantID == "" {
		return nil, http.StatusBadRequest, domain.ErrTenantRequired
	}

	plan, err := uc.planRepo.FindByID(req.PlanID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusNotFound, domain.ErrNotFound
		}
		return nil, http.StatusInternalServerError, err
	}

	if !plan.IsActive {
		return nil, http.StatusBadRequest, errors.New("plan is not active")
	}

	billingCycle := req.BillingCycle
	if billingCycle == "" {
		billingCycle = "monthly"
	}

	amount := plan.PriceMonthly
	if billingCycle == "yearly" {
		amount = plan.PriceYearly
	}

	sub, err := uc.subRepo.FindByCompany(companyID)
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusInternalServerError, err
		}
		now := time.Now()
		trialEnd := now.AddDate(0, 0, 3)
		sub = &domain.Subscription{
			ID:           uuid.New().String(),
			TenantID:     tenantID,
			CompanyID:    companyID,
			PlanID:       plan.ID,
			Status:       "pending",
			BillingCycle: billingCycle,
			Amount:       amount,
			StartedAt:    &now,
			TrialEndsAt:  &trialEnd,
		}
		if err := uc.subRepo.Create(sub); err != nil {
			return nil, http.StatusInternalServerError, err
		}
	} else {
		sub.PlanID = plan.ID
		sub.BillingCycle = billingCycle
		sub.Amount = amount
		sub.Status = "pending"
		if err := uc.subRepo.Update(sub); err != nil {
			return nil, http.StatusInternalServerError, err
		}
	}

	resp := toSubscriptionResponse(sub, plan)
	return resp, http.StatusOK, nil
}

// Cancel subscription
func (uc *SubscriptionUsecase) CancelSubscription(ctx *gin.Context) (*dto.SubscriptionResponse, int, error) {
	companyID := middleware.GetCompanyID(ctx)
	if companyID == "" {
		return nil, http.StatusBadRequest, domain.ErrTenantRequired
	}

	sub, err := uc.subRepo.FindByCompany(companyID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusNotFound, domain.ErrNotFound
		}
		return nil, http.StatusInternalServerError, err
	}

	now := time.Now()
	sub.Status = string(domain.SubCancelled)
	sub.CancelledAt = &now
	sub.AutoRenew = false

	if err := uc.subRepo.Update(sub); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	company, err := uc.companyRepo.FindByID(companyID)
	if err == nil {
		company.SubStatus = domain.SubCancelled
		uc.companyRepo.Update(company)
	}

	plan, _ := uc.planRepo.FindByID(sub.PlanID)
	resp := toSubscriptionResponse(sub, plan)
	return resp, http.StatusOK, nil
}

// HandleSubscriptionExpiry marks expired subscriptions and suspends companies
func (uc *SubscriptionUsecase) HandleSubscriptionExpiry() error {
	expired, err := uc.subRepo.FindExpired()
	if err != nil {
		return err
	}

	for _, sub := range expired {
		if sub.Status == string(domain.SubActive) || sub.Status == string(domain.SubTrial) {
			sub.Status = string(domain.SubExpired)
			uc.subRepo.Update(&sub)

			company, err := uc.companyRepo.FindByID(sub.CompanyID)
			if err == nil {
				company.SubStatus = domain.SubExpired
				uc.companyRepo.Update(company)
			}
		}
	}

	return nil
}

// Create a Midtrans payment for subscription plan change
func (uc *SubscriptionUsecase) CreateSubscriptionPayment(ctx *gin.Context, req dto.CreateSubscriptionPaymentRequest) (*dto.SubscriptionPaymentResponse, int, error) {
	companyID := middleware.GetCompanyID(ctx)
	tenantID := middleware.GetTenantID(ctx)
	if companyID == "" || tenantID == "" {
		return nil, http.StatusBadRequest, domain.ErrTenantRequired
	}

	plan, err := uc.planRepo.FindByID(req.PlanID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusNotFound, domain.ErrNotFound
		}
		return nil, http.StatusInternalServerError, err
	}

	if !plan.IsActive {
		return nil, http.StatusBadRequest, errors.New("plan is not active")
	}

	amount := plan.PriceMonthly
	billingCycle := req.BillingCycle
	if billingCycle == "" {
		billingCycle = "monthly"
	}
	if billingCycle == "yearly" {
		amount = plan.PriceYearly
	}

	// Create or update subscription
	sub, err := uc.subRepo.FindByCompany(companyID)
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusInternalServerError, err
		}
		now := time.Now()
		trialEnd := now.AddDate(0, 0, 3)
		sub = &domain.Subscription{
			ID:          uuid.New().String(),
			TenantID:    tenantID,
			CompanyID:   companyID,
			PlanID:      plan.ID,
			Status:      "pending",
			BillingCycle: billingCycle,
			Amount:      amount,
			StartedAt:   &now,
			TrialEndsAt: &trialEnd,
		}
		if err := uc.subRepo.Create(sub); err != nil {
			return nil, http.StatusInternalServerError, err
		}
	} else {
		sub.PlanID = plan.ID
		sub.BillingCycle = billingCycle
		sub.Amount = amount
		sub.Status = "pending"
		if err := uc.subRepo.Update(sub); err != nil {
			return nil, http.StatusInternalServerError, err
		}
	}

	// Create invoice
	now := time.Now()
	dueDate := now.AddDate(0, 0, 1)
	invoice := &domain.Invoice{
		ID:              uuid.New().String(),
		TenantID:        tenantID,
		CompanyID:       companyID,
		SubscriptionID:  sub.ID,
		InvoiceNumber:   fmt.Sprintf("SUB-%s-%s", now.Format("20060102"), uuid.New().String()[:8]),
		Status:          "pending",
		Amount:          amount,
		TaxAmount:       0,
		TotalAmount:     amount,
		DueDate:         &dueDate,
	}
	if err := uc.invoiceRepo.Create(invoice); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	// Get company info for customer details
	company, _ := uc.companyRepo.FindByID(companyID)
	customerEmail := company.Email
	if customerEmail == "" {
		customerEmail = fmt.Sprintf("company-%s@laundry.app", companyID[:8])
	}
	customerPhone := company.Phone
	if customerPhone == "" {
		customerPhone = "000000000000"
	}

	// Create Midtrans snap transaction
	snapReq := midtrans.SnapRequest{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:     invoice.InvoiceNumber,
			GrossAmount: int64(amount),
		},
		CustomerDetails: midtrans.CustomerDetails{
			FirstName: company.Name,
			Email:     customerEmail,
			Phone:     customerPhone,
		},
		ItemDetails: []midtrans.ItemDetails{
			{
				ID:       plan.ID,
				Name:     fmt.Sprintf("%s (%s)", plan.Name, billingCycle),
				Price:    int64(amount),
				Quantity: 1,
			},
		},
	}

	snapResp, err := uc.midtrans.CreateSnapTransaction(snapReq)
	if err != nil {
		return nil, http.StatusInternalServerError, fmt.Errorf("failed to create payment: %v", err)
	}

	resp := &dto.SubscriptionPaymentResponse{
		InvoiceID:      invoice.ID,
		InvoiceNumber:  invoice.InvoiceNumber,
		Amount:         amount,
		SnapToken:      snapResp.Token,
		RedirectURL:    snapResp.RedirectURL,
	}

	return resp, http.StatusOK, nil
}

// --- helpers ---

func toPlanResponse(plan *domain.SubscriptionPlan) *dto.PlanResponse {
	var features domain.PlanFeatures
	if plan.Features != "" {
		json.Unmarshal([]byte(plan.Features), &features)
	}

	return &dto.PlanResponse{
		ID:           plan.ID,
		Name:         plan.Name,
		Code:         plan.Code,
		Description:  plan.Description,
		PriceMonthly: plan.PriceMonthly,
		PriceYearly:  plan.PriceYearly,
		MaxUsers:     plan.MaxUsers,
		MaxBranches:  plan.MaxBranches,
		MaxOutlets:   plan.MaxOutlets,
		Features:     features,
		IsActive:     plan.IsActive,
		SortOrder:    plan.SortOrder,
		CreatedAt:    plan.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:    plan.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func toSubscriptionResponse(sub *domain.Subscription, plan *domain.SubscriptionPlan) *dto.SubscriptionResponse {
	resp := &dto.SubscriptionResponse{
		ID:           sub.ID,
		TenantID:     sub.TenantID,
		CompanyID:    sub.CompanyID,
		PlanID:       sub.PlanID,
		Status:       sub.Status,
		BillingCycle: sub.BillingCycle,
		Amount:       sub.Amount,
		AutoRenew:    sub.AutoRenew,
		CreatedAt:    sub.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:    sub.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}

	if plan != nil {
		resp.PlanName = plan.Name
		resp.PlanCode = plan.Code
	}

	if sub.StartedAt != nil {
		s := sub.StartedAt.Format("2006-01-02T15:04:05Z")
		resp.StartedAt = &s
	}
	if sub.TrialEndsAt != nil {
		s := sub.TrialEndsAt.Format("2006-01-02T15:04:05Z")
		resp.TrialEndsAt = &s
	}
	if sub.CurrentPeriodStart != nil {
		s := sub.CurrentPeriodStart.Format("2006-01-02T15:04:05Z")
		resp.CurrentPeriodStart = &s
	}
	if sub.CurrentPeriodEnd != nil {
		s := sub.CurrentPeriodEnd.Format("2006-01-02T15:04:05Z")
		resp.CurrentPeriodEnd = &s
	}
	if sub.CancelledAt != nil {
		s := sub.CancelledAt.Format("2006-01-02T15:04:05Z")
		resp.CancelledAt = &s
	}

	return resp
}
