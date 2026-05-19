package domain

import "time"

type PayStatus string

const (
	PayPending  PayStatus = "pending"
	PaySuccess  PayStatus = "success"
	PayFailed   PayStatus = "failed"
	PayExpired  PayStatus = "expired"
	PayRefunded PayStatus = "refunded"
)

type Payment struct {
	ID                   string        `gorm:"type:char(36);primaryKey"`
	TenantID             string        `gorm:"type:char(36);index;not null"`
	CompanyID            string        `gorm:"type:char(36);index;not null"`
	OrderID              string        `gorm:"type:char(36);index"`
	InvoiceID            string        `gorm:"type:char(36)"`
	Amount               float64       `gorm:"type:decimal(15,2);not null"`
	PaymentMethod        string        `gorm:"type:varchar(50)"`
	PaymentChannel       string        `gorm:"type:varchar(50)"`
	Status               PayStatus `gorm:"type:varchar(20);index;not null;default:'pending'"`
	MidtransTransactionID string       `gorm:"type:varchar(255);index"`
	MidtransStatus       string        `gorm:"type:varchar(50)"`
	PaidAt               *time.Time    `gorm:"type:datetime(3)"`
	CreatedAt            time.Time
	UpdatedAt            time.Time
}

func (Payment) TableName() string {
	return "payments"
}

type PaymentRepository interface {
	Create(payment *Payment) error
	FindByID(id string) (*Payment, error)
	FindByOrderID(orderID string) ([]Payment, error)
	FindByMidtransTransactionID(transactionID string) (*Payment, error)
	Update(payment *Payment) error
}
