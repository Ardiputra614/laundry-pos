package dto

type ProcessPaymentRequest struct {
	OrderID       string  `json:"order_id"`
	Amount        float64 `json:"amount" binding:"required,min=0"`
	PaymentMethod string  `json:"payment_method" binding:"required"`
	PaymentChannel string `json:"payment_channel"`
}

type PaymentResponse struct {
	ID                   string  `json:"id"`
	OrderID              string  `json:"order_id"`
	Amount               float64 `json:"amount"`
	PaymentMethod        string  `json:"payment_method"`
	PaymentChannel       string  `json:"payment_channel"`
	Status               string  `json:"status"`
	MidtransTransactionID string `json:"midtrans_transaction_id,omitempty"`
	PaidAt               string  `json:"paid_at,omitempty"`
	CreatedAt            string  `json:"created_at"`
}

type MidtransWebhookRequest struct {
	TransactionID   string `json:"transaction_id"`
	OrderID         string `json:"order_id"`
	TransactionStatus string `json:"transaction_status"`
	PaymentType     string `json:"payment_type"`
	GrossAmount     string `json:"gross_amount"`
	StatusCode      string `json:"status_code"`
	SignatureKey    string `json:"signature_key"`
}
