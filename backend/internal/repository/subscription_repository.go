package repository

import (
	"github.com/ardiputra/laundry-pos/internal/domain"
	"gorm.io/gorm"
)

type subscriptionRepository struct {
	db *gorm.DB
}

func NewSubscriptionRepository(db *gorm.DB) domain.SubscriptionRepository {
	return &subscriptionRepository{db: db}
}

func (r *subscriptionRepository) Create(sub *domain.Subscription) error {
	return r.db.Create(sub).Error
}

func (r *subscriptionRepository) FindByID(id string) (*domain.Subscription, error) {
	var sub domain.Subscription
	err := r.db.Where("id = ?", id).First(&sub).Error
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

func (r *subscriptionRepository) FindByTenant(tenantID string) (*domain.Subscription, error) {
	var sub domain.Subscription
	err := r.db.Where("tenant_id = ?", tenantID).First(&sub).Error
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

func (r *subscriptionRepository) FindByCompany(companyID string) (*domain.Subscription, error) {
	var sub domain.Subscription
	err := r.db.Where("company_id = ?", companyID).First(&sub).Error
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

func (r *subscriptionRepository) FindExpiring(days int) ([]domain.Subscription, error) {
	var subs []domain.Subscription
	err := r.db.Where("current_period_end IS NOT NULL AND current_period_end <= DATE_ADD(NOW(), INTERVAL ? DAY) AND current_period_end > NOW() AND status IN (?)", days, []string{"active", "trial"}).
		Find(&subs).Error
	if err != nil {
		return nil, err
	}
	return subs, nil
}

func (r *subscriptionRepository) FindExpired() ([]domain.Subscription, error) {
	var subs []domain.Subscription
	err := r.db.Where("current_period_end IS NOT NULL AND current_period_end <= NOW() AND status IN (?)", []string{"active", "trial"}).
		Find(&subs).Error
	if err != nil {
		return nil, err
	}
	return subs, nil
}

func (r *subscriptionRepository) Update(sub *domain.Subscription) error {
	return r.db.Save(sub).Error
}
