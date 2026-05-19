package repository

import (
	"github.com/ardiputra/laundry-pos/internal/domain"
	"gorm.io/gorm"
)

type serviceCategoryRepository struct {
	db *gorm.DB
}

func NewServiceCategoryRepository(db *gorm.DB) domain.ServiceCategoryRepository {
	return &serviceCategoryRepository{db: db}
}

func (r *serviceCategoryRepository) Create(category *domain.ServiceCategory) error {
	return r.db.Create(category).Error
}

func (r *serviceCategoryRepository) FindByID(id string) (*domain.ServiceCategory, error) {
	var category domain.ServiceCategory
	err := r.db.Where("id = ?", id).First(&category).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *serviceCategoryRepository) FindByTenant(tenantID string) ([]domain.ServiceCategory, error) {
	var categories []domain.ServiceCategory
	err := r.db.Where("tenant_id = ?", tenantID).
		Order("sort_order ASC, name ASC").
		Find(&categories).Error
	if err != nil {
		return nil, err
	}
	return categories, nil
}

func (r *serviceCategoryRepository) Update(category *domain.ServiceCategory) error {
	return r.db.Save(category).Error
}

func (r *serviceCategoryRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.ServiceCategory{}).Error
}

type serviceRepository struct {
	db *gorm.DB
}

func NewServiceRepository(db *gorm.DB) domain.ServiceRepository {
	return &serviceRepository{db: db}
}

func (r *serviceRepository) Create(service *domain.Service) error {
	return r.db.Create(service).Error
}

func (r *serviceRepository) FindByID(id string) (*domain.Service, error) {
	var service domain.Service
	err := r.db.Where("id = ?", id).First(&service).Error
	if err != nil {
		return nil, err
	}
	return &service, nil
}

func (r *serviceRepository) FindByTenant(tenantID string, page, limit int) ([]domain.Service, int64, error) {
	var services []domain.Service
	var total int64

	query := r.db.Model(&domain.Service{}).Where("tenant_id = ?", tenantID)
	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&services).Error
	if err != nil {
		return nil, 0, err
	}

	return services, total, nil
}

func (r *serviceRepository) FindByCategory(tenantID, categoryID string) ([]domain.Service, error) {
	var services []domain.Service
	err := r.db.Where("tenant_id = ? AND category_id = ?", tenantID, categoryID).
		Order("name ASC").
		Find(&services).Error
	if err != nil {
		return nil, err
	}
	return services, nil
}

func (r *serviceRepository) FindActiveByTenant(tenantID string) ([]domain.Service, error) {
	var services []domain.Service
	err := r.db.Where("tenant_id = ? AND is_active = ?", tenantID, true).
		Order("name ASC").
		Find(&services).Error
	if err != nil {
		return nil, err
	}
	return services, nil
}

func (r *serviceRepository) Update(service *domain.Service) error {
	return r.db.Save(service).Error
}

func (r *serviceRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.Service{}).Error
}

type servicePricingRepository struct {
	db *gorm.DB
}

func NewServicePricingRepository(db *gorm.DB) domain.ServicePricingRepository {
	return &servicePricingRepository{db: db}
}

func (r *servicePricingRepository) Create(pricing *domain.ServicePricing) error {
	return r.db.Create(pricing).Error
}

func (r *servicePricingRepository) FindByServiceID(serviceID string) ([]domain.ServicePricing, error) {
	var pricings []domain.ServicePricing
	err := r.db.Where("service_id = ?", serviceID).
		Order("min_weight ASC").
		Find(&pricings).Error
	if err != nil {
		return nil, err
	}
	return pricings, nil
}

func (r *servicePricingRepository) Update(pricing *domain.ServicePricing) error {
	return r.db.Save(pricing).Error
}

func (r *servicePricingRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.ServicePricing{}).Error
}
