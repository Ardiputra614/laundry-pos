package repository

import (
	"github.com/ardiputra/laundry-pos/internal/domain"
	"gorm.io/gorm"
)

type invoiceRepository struct {
	db *gorm.DB
}

func NewInvoiceRepository(db *gorm.DB) domain.InvoiceRepository {
	return &invoiceRepository{db: db}
}

func (r *invoiceRepository) Create(inv *domain.Invoice) error {
	return r.db.Create(inv).Error
}

func (r *invoiceRepository) FindByID(id string) (*domain.Invoice, error) {
	var inv domain.Invoice
	err := r.db.Where("id = ?", id).First(&inv).Error
	if err != nil {
		return nil, err
	}
	return &inv, nil
}

func (r *invoiceRepository) FindByInvoiceNumber(number string) (*domain.Invoice, error) {
	var inv domain.Invoice
	err := r.db.Where("invoice_number = ?", number).First(&inv).Error
	if err != nil {
		return nil, err
	}
	return &inv, nil
}

func (r *invoiceRepository) FindByCompany(companyID string, page, limit int) ([]domain.Invoice, int64, error) {
	var invoices []domain.Invoice
	var total int64

	query := r.db.Model(&domain.Invoice{}).Where("company_id = ?", companyID)
	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&invoices).Error
	if err != nil {
		return nil, 0, err
	}

	return invoices, total, nil
}

func (r *invoiceRepository) FindBySubscription(subscriptionID string) ([]domain.Invoice, error) {
	var invoices []domain.Invoice
	err := r.db.Where("subscription_id = ?", subscriptionID).Order("created_at DESC").Find(&invoices).Error
	if err != nil {
		return nil, err
	}
	return invoices, nil
}

func (r *invoiceRepository) FindPending() ([]domain.Invoice, error) {
	var invoices []domain.Invoice
	err := r.db.Where("status = ?", "pending").Order("created_at ASC").Find(&invoices).Error
	if err != nil {
		return nil, err
	}
	return invoices, nil
}

func (r *invoiceRepository) Update(inv *domain.Invoice) error {
	return r.db.Save(inv).Error
}
