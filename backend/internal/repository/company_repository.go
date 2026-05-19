package repository

import (
	"time"

	"github.com/ardiputra/laundry-pos/internal/domain"
	"gorm.io/gorm"
)

type companyRepository struct {
	db *gorm.DB
}

func NewCompanyRepository(db *gorm.DB) domain.CompanyRepository {
	return &companyRepository{db: db}
}

func (r *companyRepository) Create(company *domain.Company) error {
	return r.db.Create(company).Error
}

func (r *companyRepository) FindByID(id string) (*domain.Company, error) {
	var company domain.Company
	err := r.db.Where("id = ?", id).First(&company).Error
	if err != nil {
		return nil, err
	}
	return &company, nil
}

func (r *companyRepository) FindByTenantID(tenantID string) (*domain.Company, error) {
	var company domain.Company
	err := r.db.Where("tenant_id = ?", tenantID).First(&company).Error
	if err != nil {
		return nil, err
	}
	return &company, nil
}

func (r *companyRepository) FindBySlug(slug string) (*domain.Company, error) {
	var company domain.Company
	err := r.db.Where("slug = ?", slug).First(&company).Error
	if err != nil {
		return nil, err
	}
	return &company, nil
}

func (r *companyRepository) FindAll(page, limit int) ([]domain.Company, int64, error) {
	var companies []domain.Company
	var total int64

	r.db.Model(&domain.Company{}).Count(&total)
	offset := (page - 1) * limit
	err := r.db.Offset(offset).Limit(limit).Order("created_at DESC").Find(&companies).Error
	if err != nil {
		return nil, 0, err
	}

	return companies, total, nil
}

func (r *companyRepository) FindAllFiltered(page, limit int, status, plan string, suspended *bool) ([]domain.Company, int64, error) {
	var companies []domain.Company
	var total int64

	query := r.db.Model(&domain.Company{})
	if status != "" {
		query = query.Where("sub_status = ?", status)
	}
	if plan != "" {
		query = query.Where("plan = ?", plan)
	}
	if suspended != nil {
		query = query.Where("is_suspended = ?", *suspended)
	}

	query.Count(&total)
	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&companies).Error
	if err != nil {
		return nil, 0, err
	}

	return companies, total, nil
}

func (r *companyRepository) Update(company *domain.Company) error {
	return r.db.Save(company).Error
}

func (r *companyRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.Company{}).Error
}

func (r *companyRepository) CountActive() (int64, error) {
	var total int64
	err := r.db.Model(&domain.Company{}).Where("is_active = ?", true).Count(&total).Error
	return total, err
}

func (r *companyRepository) CountSuspended() (int64, error) {
	var total int64
	err := r.db.Model(&domain.Company{}).Where("is_suspended = ?", true).Count(&total).Error
	return total, err
}

func (r *companyRepository) CountByStatus(status domain.SubscriptionStatus) (int64, error) {
	var total int64
	err := r.db.Model(&domain.Company{}).Where("sub_status = ?", status).Count(&total).Error
	return total, err
}

func (r *companyRepository) CountCreatedSince(since time.Time) (int64, error) {
	var total int64
	err := r.db.Model(&domain.Company{}).Where("created_at >= ?", since).Count(&total).Error
	return total, err
}
