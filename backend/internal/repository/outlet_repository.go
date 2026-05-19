package repository

import (
	"github.com/ardiputra/laundry-pos/internal/domain"
	"gorm.io/gorm"
)

type outletRepository struct {
	db *gorm.DB
}

func NewOutletRepository(db *gorm.DB) domain.OutletRepository {
	return &outletRepository{db: db}
}

func (r *outletRepository) Create(outlet *domain.Outlet) error {
	return r.db.Create(outlet).Error
}

func (r *outletRepository) FindByID(id string) (*domain.Outlet, error) {
	var outlet domain.Outlet
	err := r.db.Where("id = ?", id).First(&outlet).Error
	if err != nil {
		return nil, err
	}
	return &outlet, nil
}

func (r *outletRepository) FindByCompany(companyID string) ([]domain.Outlet, error) {
	var outlets []domain.Outlet
	err := r.db.Where("company_id = ?", companyID).Order("created_at DESC").Find(&outlets).Error
	if err != nil {
		return nil, err
	}
	return outlets, nil
}

func (r *outletRepository) FindByTenant(tenantID string, page, limit int) ([]domain.Outlet, int64, error) {
	var outlets []domain.Outlet
	var total int64

	query := r.db.Model(&domain.Outlet{}).Where("tenant_id = ?", tenantID)
	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&outlets).Error
	if err != nil {
		return nil, 0, err
	}

	return outlets, total, nil
}

func (r *outletRepository) Update(outlet *domain.Outlet) error {
	return r.db.Save(outlet).Error
}

func (r *outletRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.Outlet{}).Error
}
