package usecase

import (
	"errors"
	"net/http"
	"time"

	"github.com/ardiputra/laundry-pos/internal/domain"
	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SuperadminUsecase struct {
	companyRepo domain.CompanyRepository
	userRepo    domain.UserRepository
	subRepo     domain.SubscriptionRepository
	planRepo    domain.SubscriptionPlanRepository
	invoiceRepo domain.InvoiceRepository
	paymentRepo domain.PaymentRepository
}

func NewSuperadminUsecase(
	companyRepo domain.CompanyRepository,
	userRepo domain.UserRepository,
	subRepo domain.SubscriptionRepository,
	planRepo domain.SubscriptionPlanRepository,
	invoiceRepo domain.InvoiceRepository,
	paymentRepo domain.PaymentRepository,
) *SuperadminUsecase {
	return &SuperadminUsecase{
		companyRepo: companyRepo,
		userRepo:    userRepo,
		subRepo:     subRepo,
		planRepo:    planRepo,
		invoiceRepo: invoiceRepo,
		paymentRepo: paymentRepo,
	}
}

func (uc *SuperadminUsecase) ListCompanies(ctx *gin.Context, page, limit int, status, plan string) ([]dto.CompanyListResponse, int64, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var suspended *bool
	companies, total, err := uc.companyRepo.FindAllFiltered(page, limit, status, plan, suspended)
	if err != nil {
		return nil, 0, http.StatusInternalServerError, err
	}

	var responses []dto.CompanyListResponse
	for _, c := range companies {
		userCount, _ := uc.userRepo.CountByCompany(c.ID)
		responses = append(responses, dto.CompanyListResponse{
			ID:          c.ID,
			TenantID:    c.TenantID,
			Name:        c.Name,
			Slug:        c.Slug,
			Email:       c.Email,
			Phone:       c.Phone,
			Plan:        string(c.Plan),
			SubStatus:   string(c.SubStatus),
			IsActive:    c.IsActive,
			IsSuspended: c.IsSuspended,
			MaxUsers:    c.MaxUsers,
			MaxBranches: c.MaxBranches,
			UserCount:   userCount,
			CreatedAt:   c.CreatedAt.Format("2006-01-02T15:04:05Z"),
			UpdatedAt:   c.UpdatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}

	return responses, total, http.StatusOK, nil
}

func (uc *SuperadminUsecase) GetCompanyDetail(ctx *gin.Context, id string) (*dto.CompanyDetailResponse, int, error) {
	company, err := uc.companyRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusNotFound, domain.ErrNotFound
		}
		return nil, http.StatusInternalServerError, err
	}

	userCount, _ := uc.userRepo.CountByCompany(company.ID)

	resp := &dto.CompanyDetailResponse{
		ID:          company.ID,
		TenantID:    company.TenantID,
		Name:        company.Name,
		Slug:        company.Slug,
		Logo:        company.Logo,
		Address:     company.Address,
		Phone:       company.Phone,
		Email:       company.Email,
		TaxID:       company.TaxID,
		Currency:    company.Currency,
		Timezone:    company.Timezone,
		IsActive:    company.IsActive,
		IsSuspended: company.IsSuspended,
		Plan:        string(company.Plan),
		SubStatus:   string(company.SubStatus),
		MaxUsers:    company.MaxUsers,
		MaxBranches: company.MaxBranches,
		CreatedAt:   company.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:   company.UpdatedAt.Format("2006-01-02T15:04:05Z"),
		UserCount:   userCount,
	}

	sub, err := uc.subRepo.FindByCompany(company.ID)
	if err == nil {
		plan, _ := uc.planRepo.FindByID(sub.PlanID)
		subResp := toSubscriptionResponse(sub, plan)
		resp.Subscription = subResp
	}

	return resp, http.StatusOK, nil
}

func (uc *SuperadminUsecase) SuspendCompany(ctx *gin.Context, id string) (int, error) {
	company, err := uc.companyRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, domain.ErrNotFound
		}
		return http.StatusInternalServerError, err
	}

	company.IsSuspended = true
	if err := uc.companyRepo.Update(company); err != nil {
		return http.StatusInternalServerError, err
	}

	return http.StatusOK, nil
}

func (uc *SuperadminUsecase) ActivateCompany(ctx *gin.Context, id string) (int, error) {
	company, err := uc.companyRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, domain.ErrNotFound
		}
		return http.StatusInternalServerError, err
	}

	company.IsSuspended = false
	if err := uc.companyRepo.Update(company); err != nil {
		return http.StatusInternalServerError, err
	}

	return http.StatusOK, nil
}

func (uc *SuperadminUsecase) GetDashboardStats(ctx *gin.Context) (*dto.DashboardStatsResponse, int, error) {
	totalCompanies, _ := uc.companyRepo.CountActive()
	suspended, _ := uc.companyRepo.CountSuspended()
	trialCount, _ := uc.companyRepo.CountByStatus(domain.SubTrial)

	activeSubCount, _ := uc.companyRepo.CountByStatus(domain.SubActive)

	now := time.Now()
	firstOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	newThisMonth, _ := uc.companyRepo.CountCreatedSince(firstOfMonth)

	_, totalAllCount, _ := uc.companyRepo.FindAll(1, 1)

	totalRevenue, _ := uc.paymentRepo.SumSuccessPayments()
	monthlyRevenue, _ := uc.paymentRepo.SumSuccessPaymentsSince(firstOfMonth)

	stats := &dto.DashboardStatsResponse{
		TotalCompanies:        totalAllCount,
		ActiveCompanies:       totalCompanies,
		SuspendedCompanies:    suspended,
		TrialCompanies:        trialCount,
		ActiveSubscriptions:   activeSubCount,
		MonthlyRevenue:        monthlyRevenue,
		TotalRevenue:          totalRevenue,
		NewCompaniesThisMonth: newThisMonth,
	}

	return stats, http.StatusOK, nil
}

func (uc *SuperadminUsecase) GetSystemHealth(ctx *gin.Context) (*dto.SystemHealthResponse, int, error) {
	dbStatus := dto.ServiceStatus{Status: "healthy", Message: "connected"}

	_, err := uc.companyRepo.CountActive()
	if err != nil {
		dbStatus = dto.ServiceStatus{Status: "unhealthy", Message: err.Error()}
	}

	health := &dto.SystemHealthResponse{
		Database: dbStatus,
		API:      dto.ServiceStatus{Status: "healthy", Message: "running"},
		Uptime:   time.Now().Format(time.RFC3339),
		Version:  "1.0.0",
	}

	return health, http.StatusOK, nil
}
