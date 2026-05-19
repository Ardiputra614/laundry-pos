package repository

import (
	"github.com/ardiputra/laundry-pos/internal/domain"
	"gorm.io/gorm"
)

type activityLogRepository struct {
	db *gorm.DB
}

func NewActivityLogRepository(db *gorm.DB) domain.ActivityLogRepository {
	return &activityLogRepository{db: db}
}

func (r *activityLogRepository) Create(log *domain.ActivityLog) error {
	return r.db.Create(log).Error
}

func (r *activityLogRepository) findBy(field, value string, page, limit int) ([]domain.ActivityLog, int64, error) {
	var logs []domain.ActivityLog
	var total int64

	query := r.db.Model(&domain.ActivityLog{}).Where(field+" = ?", value)
	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&logs).Error
	if err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

func (r *activityLogRepository) FindByTenant(tenantID string, page, limit int) ([]domain.ActivityLog, int64, error) {
	return r.findBy("tenant_id", tenantID, page, limit)
}

func (r *activityLogRepository) FindByCompany(companyID string, page, limit int) ([]domain.ActivityLog, int64, error) {
	return r.findBy("company_id", companyID, page, limit)
}

func (r *activityLogRepository) FindByUser(userID string, page, limit int) ([]domain.ActivityLog, int64, error) {
	return r.findBy("user_id", userID, page, limit)
}
