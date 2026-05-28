package dto

type OrderItemRequest struct {
	ServiceID   string  `json:"service_id"`
	ServiceName string  `json:"service_name"`
	Quantity    float64 `json:"quantity" binding:"required,min=0.01"`
	Unit        string  `json:"unit"`
	UnitPrice   float64 `json:"unit_price" binding:"required,min=0"`
	Notes       string  `json:"notes"`
}

type CreateOrderRequest struct {
	CustomerID     string             `json:"customer_id"`
	OrderType      string             `json:"order_type"`
	ServiceType    string             `json:"service_type"`
	Items          []OrderItemRequest `json:"items" binding:"required,min=1"`
	DiscountAmount float64            `json:"discount_amount"`
	TaxAmount      float64            `json:"tax_amount"`
	Notes          string             `json:"notes"`
	PickupDate     string             `json:"pickup_date"`
	DeliveryDate   string             `json:"delivery_date"`
}

type UpdateOrderStatusRequest struct {
	Status string `json:"status" binding:"required"`
	Note   string `json:"note"`
}

type OrderItemResponse struct {
	ID          string  `json:"id"`
	ServiceID   string  `json:"service_id"`
	ServiceName string  `json:"service_name"`
	Quantity    float64 `json:"quantity"`
	Unit        string  `json:"unit"`
	UnitPrice   float64 `json:"unit_price"`
	Subtotal    float64 `json:"subtotal"`
	Notes       string  `json:"notes"`
}

type OrderResponse struct {
	ID              string              `json:"id"`
	CustomerID      string              `json:"customer_id"`
	CustomerName    string              `json:"customer_name"`
	CustomerPhone   string              `json:"customer_phone"`
	CustomerAddress string              `json:"customer_address"`
	UserID          string              `json:"user_id"`
	InvoiceNumber   string              `json:"invoice_number"`
	Status          string              `json:"status"`
	OrderType       string              `json:"order_type"`
	ServiceType     string              `json:"service_type"`
	TotalWeight     float64             `json:"total_weight"`
	TotalItems      int                 `json:"total_items"`
	Subtotal        float64             `json:"subtotal"`
	DiscountAmount  float64             `json:"discount_amount"`
	TaxAmount       float64             `json:"tax_amount"`
	GrandTotal      float64             `json:"grand_total"`
	PaidAmount      float64             `json:"paid_amount"`
	ChangeAmount    float64             `json:"change_amount"`
	PaymentStatus   string              `json:"payment_status"`
	PaymentMethod   string              `json:"payment_method"`
	Notes           string              `json:"notes"`
	PickupDate      string              `json:"pickup_date"`
	DeliveryDate   string              `json:"delivery_date"`
	EstimatedDoneAt string              `json:"estimated_done_at"`
	CompletedAt     string              `json:"completed_at"`
	Items           []OrderItemResponse `json:"items,omitempty"`
	CreatedAt       string              `json:"created_at"`
	UpdatedAt       string              `json:"updated_at"`
}

type OrderListResponse struct {
	ID             string  `json:"id"`
	InvoiceNumber  string  `json:"invoice_number"`
	CustomerID     string  `json:"customer_id"`
	CustomerName   string  `json:"customer_name"`
	Status         string  `json:"status"`
	OrderType      string  `json:"order_type"`
	TotalItems     int     `json:"total_items"`
	GrandTotal     float64 `json:"grand_total"`
	PaymentStatus  string  `json:"payment_status"`
	EstimatedDoneAt string `json:"estimated_done_at,omitempty"`
	CreatedAt      string  `json:"created_at"`
}
