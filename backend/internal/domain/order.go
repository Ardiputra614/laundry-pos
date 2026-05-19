package domain

import "time"

type OrderStatus string

const (
	OrderStatusPending    OrderStatus = "pending"
	OrderStatusProcessing OrderStatus = "processing"
	OrderStatusWashing    OrderStatus = "washing"
	OrderStatusDrying     OrderStatus = "drying"
	OrderStatusIroning    OrderStatus = "ironing"
	OrderStatusPacking    OrderStatus = "packing"
	OrderStatusReady      OrderStatus = "ready"
	OrderStatusDelivered  OrderStatus = "delivered"
	OrderStatusCompleted  OrderStatus = "completed"
	OrderStatusCancelled  OrderStatus = "cancelled"
)

type PaymentStatus string

const (
	PaymentStatusUnpaid    PaymentStatus = "unpaid"
	PaymentStatusPartial   PaymentStatus = "partial"
	PaymentStatusPaid      PaymentStatus = "paid"
	PaymentStatusRefunded  PaymentStatus = "refunded"
)

type Order struct {
	ID              string        `gorm:"type:char(36);primaryKey"`
	TenantID        string        `gorm:"type:char(36);index;not null"`
	CompanyID       string        `gorm:"type:char(36);index;not null"`
	BranchID        string        `gorm:"type:char(36);index"`
	OutletID        string        `gorm:"type:char(36);index"`
	CustomerID      string        `gorm:"type:char(36);index"`
	UserID          string        `gorm:"type:char(36);index;not null"`
	InvoiceNumber   string        `gorm:"type:varchar(50);uniqueIndex;not null"`
	Status          OrderStatus   `gorm:"type:varchar(30);index;not null;default:'pending'"`
	OrderType       string        `gorm:"type:varchar(20);not null;default:'pickup'"`
	ServiceType     string        `gorm:"type:varchar(20);not null;default:'regular'"`
	TotalWeight     float64       `gorm:"type:decimal(10,2);default:0"`
	TotalItems      int           `gorm:"default:0"`
	Subtotal        float64       `gorm:"type:decimal(15,2);not null;default:0"`
	DiscountAmount  float64       `gorm:"type:decimal(15,2);not null;default:0"`
	TaxAmount       float64       `gorm:"type:decimal(15,2);not null;default:0"`
	GrandTotal      float64       `gorm:"type:decimal(15,2);not null;default:0"`
	PaidAmount      float64       `gorm:"type:decimal(15,2);not null;default:0"`
	ChangeAmount    float64       `gorm:"type:decimal(15,2);not null;default:0"`
	PaymentStatus   PaymentStatus `gorm:"type:varchar(20);index;not null;default:'unpaid'"`
	PaymentMethod   string        `gorm:"type:varchar(50)"`
	Notes           string        `gorm:"type:text"`
	PickupDate      *time.Time    `gorm:"type:date"`
	DeliveryDate    *time.Time    `gorm:"type:date"`
	EstimatedDoneAt *time.Time    `gorm:"type:datetime(3)"`
	CompletedAt     *time.Time    `gorm:"type:datetime(3)"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	DeletedAt       *time.Time `gorm:"index"`
}

func (Order) TableName() string {
	return "orders"
}

type OrderItem struct {
	ID          string  `gorm:"type:char(36);primaryKey"`
	TenantID    string  `gorm:"type:char(36);index;not null"`
	OrderID     string  `gorm:"type:char(36);index;not null"`
	ServiceID   string  `gorm:"type:char(36);index;not null"`
	ServiceName string  `gorm:"type:varchar(255);not null"`
	Quantity    float64 `gorm:"type:decimal(10,2);not null;default:1"`
	Unit        string  `gorm:"type:varchar(20);not null;default:'kg'"`
	UnitPrice   float64 `gorm:"type:decimal(15,2);not null;default:0"`
	Subtotal    float64 `gorm:"type:decimal(15,2);not null;default:0"`
	Notes       string  `gorm:"type:text"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (OrderItem) TableName() string {
	return "order_items"
}

type OrderTracking struct {
	ID        string    `gorm:"type:char(36);primaryKey"`
	TenantID  string    `gorm:"type:char(36);index;not null"`
	OrderID   string    `gorm:"type:char(36);index;not null"`
	Status    string    `gorm:"type:varchar(30);not null"`
	Note      string    `gorm:"type:text"`
	CreatedBy string    `gorm:"type:char(36)"`
	CreatedAt time.Time
}

func (OrderTracking) TableName() string {
	return "order_trackings"
}

type OrderRepository interface {
	Create(order *Order) error
	CreateWithItems(order *Order, items []OrderItem) error
	FindByID(id string) (*Order, error)
	FindByInvoiceNumber(invoice string) (*Order, error)
	FindByTenant(tenantID string, page, limit int, filters map[string]any) ([]Order, int64, error)
	FindByCustomerID(tenantID, customerID string, page, limit int) ([]Order, int64, error)
	FindLastInvoiceToday(tenantID, datePrefix string) (*Order, error)
	Update(order *Order) error
	UpdateFields(orderID string, fields map[string]any) error
	UpdateStatus(orderID string, status OrderStatus) error
	Delete(id string) error
}

type OrderItemRepository interface {
	Create(item *OrderItem) error
	CreateBatch(items []OrderItem) error
	FindByOrderID(orderID string) ([]OrderItem, error)
	DeleteByOrderID(orderID string) error
}

type OrderTrackingRepository interface {
	Create(tracking *OrderTracking) error
	FindByOrderID(orderID string) ([]OrderTracking, error)
}
