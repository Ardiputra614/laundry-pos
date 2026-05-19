package repository

import (
	"github.com/ardiputra/laundry-pos/internal/domain"
	"gorm.io/gorm"
)

type employeeRepository struct {
	db *gorm.DB
}

func NewEmployeeRepository(db *gorm.DB) domain.EmployeeRepository {
	return &employeeRepository{db: db}
}

func (r *employeeRepository) Create(emp *domain.Employee) error {
	return r.db.Create(emp).Error
}

func (r *employeeRepository) FindByID(id string) (*domain.Employee, error) {
	var emp domain.Employee
	err := r.db.Where("id = ?", id).First(&emp).Error
	if err != nil {
		return nil, err
	}
	return &emp, nil
}

func (r *employeeRepository) FindByCompany(companyID string, page, limit int) ([]domain.Employee, int64, error) {
	var employees []domain.Employee
	var total int64

	query := r.db.Model(&domain.Employee{}).Where("company_id = ?", companyID)
	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&employees).Error
	if err != nil {
		return nil, 0, err
	}

	return employees, total, nil
}

func (r *employeeRepository) FindByTenant(tenantID string, page, limit int) ([]domain.Employee, int64, error) {
	var employees []domain.Employee
	var total int64

	query := r.db.Model(&domain.Employee{}).Where("tenant_id = ?", tenantID)
	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&employees).Error
	if err != nil {
		return nil, 0, err
	}

	return employees, total, nil
}

func (r *employeeRepository) FindByBranch(branchID string) ([]domain.Employee, error) {
	var employees []domain.Employee
	err := r.db.Where("branch_id = ?", branchID).Order("created_at DESC").Find(&employees).Error
	if err != nil {
		return nil, err
	}
	return employees, nil
}

func (r *employeeRepository) Update(emp *domain.Employee) error {
	return r.db.Save(emp).Error
}

func (r *employeeRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.Employee{}).Error
}
