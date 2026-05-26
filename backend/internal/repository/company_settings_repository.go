package repository

import (
	"github.com/ardiputra/laundry-pos/internal/domain"
	"gorm.io/gorm"
)

type companySettingRepository struct {
	db *gorm.DB
}

func NewCompanySettingRepository(db *gorm.DB) domain.CompanySettingRepository {
	return &companySettingRepository{db: db}
}

func (r *companySettingRepository) FindByTenant(tenantID string) (*domain.CompanySetting, error) {
	var setting domain.CompanySetting
	err := r.db.Where("tenant_id = ?", tenantID).First(&setting).Error
	if err != nil {
		return nil, err
	}
	return &setting, nil
}

func (r *companySettingRepository) Upsert(setting *domain.CompanySetting) error {
	return r.db.Save(setting).Error
}
