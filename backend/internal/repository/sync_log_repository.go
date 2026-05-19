package repository

import (
	"github.com/ardiputra/laundry-pos/internal/domain"
	"gorm.io/gorm"
)

type syncLogRepository struct {
	db *gorm.DB
}

func NewSyncLogRepository(db *gorm.DB) domain.SyncLogRepository {
	return &syncLogRepository{db: db}
}

func (r *syncLogRepository) Create(log *domain.SyncLog) error {
	return r.db.Create(log).Error
}

func (r *syncLogRepository) FindByID(id string) (*domain.SyncLog, error) {
	var log domain.SyncLog
	err := r.db.Where("id = ?", id).First(&log).Error
	if err != nil {
		return nil, err
	}
	return &log, nil
}

func (r *syncLogRepository) FindByTenant(tenantID string, page, limit int) ([]domain.SyncLog, int64, error) {
	var logs []domain.SyncLog
	var total int64

	query := r.db.Model(&domain.SyncLog{}).Where("tenant_id = ?", tenantID)
	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&logs).Error
	if err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

func (r *syncLogRepository) FindByDevice(deviceID string, page, limit int) ([]domain.SyncLog, int64, error) {
	var logs []domain.SyncLog
	var total int64

	query := r.db.Model(&domain.SyncLog{}).Where("device_id = ?", deviceID)
	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&logs).Error
	if err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

func (r *syncLogRepository) Update(log *domain.SyncLog) error {
	return r.db.Save(log).Error
}
