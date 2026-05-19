package repository

import (
	"github.com/ardiputra/laundry-pos/internal/domain"
	"gorm.io/gorm"
)

type branchRepository struct {
	db *gorm.DB
}

func NewBranchRepository(db *gorm.DB) domain.BranchRepository {
	return &branchRepository{db: db}
}

func (r *branchRepository) Create(branch *domain.Branch) error {
	return r.db.Create(branch).Error
}

func (r *branchRepository) FindByID(id string) (*domain.Branch, error) {
	var branch domain.Branch
	err := r.db.Where("id = ?", id).First(&branch).Error
	if err != nil {
		return nil, err
	}
	return &branch, nil
}

func (r *branchRepository) FindByCompany(companyID string) ([]domain.Branch, error) {
	var branches []domain.Branch
	err := r.db.Where("company_id = ?", companyID).Order("created_at DESC").Find(&branches).Error
	if err != nil {
		return nil, err
	}
	return branches, nil
}

func (r *branchRepository) FindByTenant(tenantID string, page, limit int) ([]domain.Branch, int64, error) {
	var branches []domain.Branch
	var total int64

	query := r.db.Model(&domain.Branch{}).Where("tenant_id = ?", tenantID)
	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&branches).Error
	if err != nil {
		return nil, 0, err
	}

	return branches, total, nil
}

func (r *branchRepository) Update(branch *domain.Branch) error {
	return r.db.Save(branch).Error
}

func (r *branchRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.Branch{}).Error
}
