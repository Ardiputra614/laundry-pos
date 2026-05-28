package repository

import (
	"github.com/ardiputra/laundry-pos/internal/domain"
	"gorm.io/gorm"
)

type customerRepository struct {
	db *gorm.DB
}

func NewCustomerRepository(db *gorm.DB) domain.CustomerRepository {
	return &customerRepository{db: db}
}

func (r *customerRepository) FindByID(id string) (*domain.Customer, error) {
	var customer domain.Customer
	err := r.db.Where("id = ?", id).First(&customer).Error
	if err != nil {
		return nil, err
	}
	return &customer, nil
}

func (r *customerRepository) FindByTenant(tenantID string, page, limit int) ([]domain.Customer, int64, error) {
	var customers []domain.Customer
	var total int64

	query := r.db.Model(&domain.Customer{}).Where("tenant_id = ?", tenantID)
	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&customers).Error
	if err != nil {
		return nil, 0, err
	}

	return customers, total, nil
}

func (r *customerRepository) FindByPhone(tenantID, phone string) (*domain.Customer, error) {
	var customer domain.Customer
	err := r.db.Where("tenant_id = ? AND phone = ?", tenantID, phone).First(&customer).Error
	if err != nil {
		return nil, err
	}
	return &customer, nil
}

func (r *customerRepository) Create(customer *domain.Customer) error {
	return r.db.Create(customer).Error
}

func (r *customerRepository) Update(customer *domain.Customer) error {
	return r.db.Save(customer).Error
}

func (r *customerRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.Customer{}).Error
}
