package repository

import (
	"time"

	"github.com/ardiputra/laundry-pos/internal/domain"
	"gorm.io/gorm"
)

type paymentRepository struct {
	db *gorm.DB
}

func NewPaymentRepository(db *gorm.DB) domain.PaymentRepository {
	return &paymentRepository{db: db}
}

func (r *paymentRepository) Create(payment *domain.Payment) error {
	return r.db.Create(payment).Error
}

func (r *paymentRepository) FindByID(id string) (*domain.Payment, error) {
	var payment domain.Payment
	err := r.db.Where("id = ?", id).First(&payment).Error
	if err != nil {
		return nil, err
	}
	return &payment, nil
}

func (r *paymentRepository) FindByOrderID(orderID string) ([]domain.Payment, error) {
	var payments []domain.Payment
	err := r.db.Where("order_id = ?", orderID).Order("created_at DESC").Find(&payments).Error
	if err != nil {
		return nil, err
	}
	return payments, nil
}

func (r *paymentRepository) FindByMidtransTransactionID(transactionID string) (*domain.Payment, error) {
	var payment domain.Payment
	err := r.db.Where("midtrans_transaction_id = ?", transactionID).First(&payment).Error
	if err != nil {
		return nil, err
	}
	return &payment, nil
}

func (r *paymentRepository) Update(payment *domain.Payment) error {
	return r.db.Save(payment).Error
}

func (r *paymentRepository) SumSuccessPayments() (float64, error) {
	var total float64
	err := r.db.Model(&domain.Payment{}).
		Where("status = ?", domain.PaySuccess).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&total).Error
	return total, err
}

func (r *paymentRepository) SumSuccessPaymentsSince(since time.Time) (float64, error) {
	var total float64
	err := r.db.Model(&domain.Payment{}).
		Where("status = ? AND paid_at >= ?", domain.PaySuccess, since).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&total).Error
	return total, err
}
