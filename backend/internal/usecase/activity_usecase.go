package usecase

import (
	"time"

	"github.com/ardiputra/laundry-pos/internal/domain"
	"github.com/ardiputra/laundry-pos/internal/middleware"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ActivityUsecase struct {
	activityRepo domain.ActivityLogRepository
}

func NewActivityUsecase(activityRepo domain.ActivityLogRepository) *ActivityUsecase {
	return &ActivityUsecase{activityRepo: activityRepo}
}

type LogActivityInput struct {
	Action      string
	EntityType  string
	EntityID    string
	Description string
	Metadata    string
}

func (uc *ActivityUsecase) Log(ctx *gin.Context, input LogActivityInput) (*domain.ActivityLog, error) {
	tenantID := middleware.GetTenantID(ctx)
	companyID := middleware.GetCompanyID(ctx)
	userID := middleware.GetUserID(ctx)

	now := time.Now()
	log := &domain.ActivityLog{
		ID:          uuid.New().String(),
		TenantID:    tenantID,
		CompanyID:   companyID,
		UserID:      userID,
		Action:      input.Action,
		EntityType:  input.EntityType,
		EntityID:    input.EntityID,
		Description: input.Description,
		IPAddress:   ctx.ClientIP(),
		UserAgent:   ctx.GetHeader("User-Agent"),
		Metadata:    input.Metadata,
		CreatedAt:   now,
	}

	if err := uc.activityRepo.Create(log); err != nil {
		return nil, err
	}

	return log, nil
}

// LogActivityDirect creates an activity log entry without a gin context.
// Useful for background workers or internal operations.
func (uc *ActivityUsecase) LogActivityDirect(tenantID, companyID, userID, action, entityType, entityID, description, ipAddr, userAgent, metadata string) error {
	log := &domain.ActivityLog{
		ID:          uuid.New().String(),
		TenantID:    tenantID,
		CompanyID:   companyID,
		UserID:      userID,
		Action:      action,
		EntityType:  entityType,
		EntityID:    entityID,
		Description: description,
		IPAddress:   ipAddr,
		UserAgent:   userAgent,
		Metadata:    metadata,
		CreatedAt:   time.Now(),
	}

	return uc.activityRepo.Create(log)
}

func (uc *ActivityUsecase) ListByTenant(ctx *gin.Context, page, limit int) ([]domain.ActivityLog, int64, error) {
	tenantID := middleware.GetTenantID(ctx)
	if tenantID == "" {
		return nil, 0, domain.ErrTenantRequired
	}

	return uc.activityRepo.FindByTenant(tenantID, page, limit)
}

func (uc *ActivityUsecase) ListByCompany(ctx *gin.Context, page, limit int) ([]domain.ActivityLog, int64, error) {
	companyID := middleware.GetCompanyID(ctx)
	if companyID == "" {
		return nil, 0, domain.ErrTenantRequired
	}

	return uc.activityRepo.FindByCompany(companyID, page, limit)
}

func (uc *ActivityUsecase) ListByUser(ctx *gin.Context, page, limit int) ([]domain.ActivityLog, int64, error) {
	userID := middleware.GetUserID(ctx)
	if userID == "" {
		return nil, 0, domain.ErrUnauthorized
	}

	return uc.activityRepo.FindByUser(userID, page, limit)
}
