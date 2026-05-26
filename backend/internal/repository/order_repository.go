package repository

import (
	"github.com/ardiputra/laundry-pos/internal/domain"
	"gorm.io/gorm"
)

type orderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) domain.OrderRepository {
	return &orderRepository{db: db}
}

func (r *orderRepository) Create(order *domain.Order) error {
	return r.db.Create(order).Error
}

func (r *orderRepository) CreateWithItems(order *domain.Order, items []domain.OrderItem) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(order).Error; err != nil {
			return err
		}
		for i := range items {
			items[i].OrderID = order.ID
			items[i].TenantID = order.TenantID
		}
		if err := tx.Create(&items).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *orderRepository) FindByID(id string) (*domain.Order, error) {
	var order domain.Order
	err := r.db.Where("id = ?", id).First(&order).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *orderRepository) FindByInvoiceNumber(invoice string) (*domain.Order, error) {
	var order domain.Order
	err := r.db.Where("invoice_number = ?", invoice).First(&order).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *orderRepository) FindByTenant(tenantID string, page, limit int, filters map[string]any) ([]domain.Order, int64, error) {
	var orders []domain.Order
	var total int64

	query := r.db.Model(&domain.Order{}).Where("tenant_id = ?", tenantID)

	if status, ok := filters["status"]; ok && status != "" {
		query = query.Where("status = ?", status)
	}
	if paymentStatus, ok := filters["payment_status"]; ok && paymentStatus != "" {
		query = query.Where("payment_status = ?", paymentStatus)
	}
	if startDate, ok := filters["start_date"]; ok && startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}
	if endDate, ok := filters["end_date"]; ok && endDate != "" {
		query = query.Where("created_at <= ?", endDate)
	}
	if customerID, ok := filters["customer_id"]; ok && customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}
	if search, ok := filters["search"]; ok && search != "" {
		query = query.Where("invoice_number LIKE ? OR id = ?", "%"+search.(string)+"%", search)
	}

	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&orders).Error
	if err != nil {
		return nil, 0, err
	}

	return orders, total, nil
}

func (r *orderRepository) FindByCustomerID(tenantID, customerID string, page, limit int) ([]domain.Order, int64, error) {
	var orders []domain.Order
	var total int64

	query := r.db.Model(&domain.Order{}).Where("tenant_id = ? AND customer_id = ?", tenantID, customerID)
	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&orders).Error
	if err != nil {
		return nil, 0, err
	}

	return orders, total, nil
}

func (r *orderRepository) FindLastInvoiceToday(tenantID, datePrefix string) (*domain.Order, error) {
	var order domain.Order
	err := r.db.Where("tenant_id = ? AND invoice_number LIKE ?", tenantID, datePrefix+"%").
		Order("created_at DESC").
		First(&order).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *orderRepository) Update(order *domain.Order) error {
	return r.db.Save(order).Error
}

func (r *orderRepository) UpdateFields(orderID string, fields map[string]any) error {
	return r.db.Model(&domain.Order{}).Where("id = ?", orderID).Updates(fields).Error
}

func (r *orderRepository) UpdateStatus(orderID string, status domain.OrderStatus) error {
	return r.db.Model(&domain.Order{}).Where("id = ?", orderID).
		Update("status", status).Error
}

func (r *orderRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.Order{}).Error
}

type orderItemRepository struct {
	db *gorm.DB
}

func NewOrderItemRepository(db *gorm.DB) domain.OrderItemRepository {
	return &orderItemRepository{db: db}
}

func (r *orderItemRepository) Create(item *domain.OrderItem) error {
	return r.db.Create(item).Error
}

func (r *orderItemRepository) CreateBatch(items []domain.OrderItem) error {
	if len(items) == 0 {
		return nil
	}
	return r.db.Create(&items).Error
}

func (r *orderItemRepository) FindByOrderIDs(orderIDs []string) ([]domain.OrderItem, error) {
	if len(orderIDs) == 0 {
		return nil, nil
	}
	var items []domain.OrderItem
	err := r.db.Where("order_id IN ?", orderIDs).Order("created_at ASC").Find(&items).Error
	if err != nil {
		return nil, err
	}
	return items, nil
}

func (r *orderItemRepository) FindByOrderID(orderID string) ([]domain.OrderItem, error) {
	var items []domain.OrderItem
	err := r.db.Where("order_id = ?", orderID).Order("created_at ASC").Find(&items).Error
	if err != nil {
		return nil, err
	}
	return items, nil
}

func (r *orderItemRepository) DeleteByOrderID(orderID string) error {
	return r.db.Where("order_id = ?", orderID).Delete(&domain.OrderItem{}).Error
}

type orderTrackingRepository struct {
	db *gorm.DB
}

func NewOrderTrackingRepository(db *gorm.DB) domain.OrderTrackingRepository {
	return &orderTrackingRepository{db: db}
}

func (r *orderTrackingRepository) Create(tracking *domain.OrderTracking) error {
	return r.db.Create(tracking).Error
}

func (r *orderTrackingRepository) FindByOrderID(orderID string) ([]domain.OrderTracking, error) {
	var trackings []domain.OrderTracking
	err := r.db.Where("order_id = ?", orderID).Order("created_at ASC").Find(&trackings).Error
	if err != nil {
		return nil, err
	}
	return trackings, nil
}
