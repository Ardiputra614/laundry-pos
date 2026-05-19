package dto

type RegisterDeviceRequest struct {
	DeviceName string `json:"device_name" binding:"required"`
	DeviceType string `json:"device_type" binding:"required"`
	DeviceID   string `json:"device_id" binding:"required"`
	FCMToken   string `json:"fcm_token"`
	BranchID   string `json:"branch_id"`
}

type DeviceResponse struct {
	ID         string  `json:"id"`
	CompanyID  string  `json:"company_id"`
	BranchID   string  `json:"branch_id,omitempty"`
	UserID     string  `json:"user_id"`
	DeviceName string  `json:"device_name"`
	DeviceType string  `json:"device_type"`
	DeviceID   string  `json:"device_id"`
	IsActive   bool    `json:"is_active"`
	LastSyncAt *string `json:"last_sync_at,omitempty"`
	CreatedAt  string  `json:"created_at"`
	UpdatedAt  string  `json:"updated_at"`
}
