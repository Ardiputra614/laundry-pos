package repository

import (
	"github.com/ardiputra/laundry-pos/internal/domain"
	"gorm.io/gorm"
)

type subscriptionPlanRepository struct {
	db *gorm.DB
}

func NewSubscriptionPlanRepository(db *gorm.DB) domain.SubscriptionPlanRepository {
	return &subscriptionPlanRepository{db: db}
}

func (r *subscriptionPlanRepository) Create(plan *domain.SubscriptionPlan) error {
	return r.db.Create(plan).Error
}

func (r *subscriptionPlanRepository) FindByID(id string) (*domain.SubscriptionPlan, error) {
	var plan domain.SubscriptionPlan
	err := r.db.Where("id = ?", id).First(&plan).Error
	if err != nil {
		return nil, err
	}
	return &plan, nil
}

func (r *subscriptionPlanRepository) FindByCode(code string) (*domain.SubscriptionPlan, error) {
	var plan domain.SubscriptionPlan
	err := r.db.Where("code = ?", code).First(&plan).Error
	if err != nil {
		return nil, err
	}
	return &plan, nil
}

func (r *subscriptionPlanRepository) FindAll() ([]domain.SubscriptionPlan, error) {
	var plans []domain.SubscriptionPlan
	err := r.db.Order("sort_order ASC, name ASC").Find(&plans).Error
	if err != nil {
		return nil, err
	}
	return plans, nil
}

func (r *subscriptionPlanRepository) FindActive() ([]domain.SubscriptionPlan, error) {
	var plans []domain.SubscriptionPlan
	err := r.db.Where("is_active = ?", true).Order("sort_order ASC, name ASC").Find(&plans).Error
	if err != nil {
		return nil, err
	}
	return plans, nil
}

func (r *subscriptionPlanRepository) Update(plan *domain.SubscriptionPlan) error {
	return r.db.Save(plan).Error
}

func (r *subscriptionPlanRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.SubscriptionPlan{}).Error
}
