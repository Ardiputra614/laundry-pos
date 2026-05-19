package domain

import "time"

type Device struct {
	ID         string     `gorm:"type:char(36);primaryKey"`
	TenantID   string     `gorm:"type:char(36);index;not null"`
	CompanyID  string     `gorm:"type:char(36);index;not null"`
	BranchID   string     `gorm:"type:char(36);index"`
	UserID     string     `gorm:"type:char(36);index;not null"`
	DeviceName string     `gorm:"type:varchar(255)"`
	DeviceType string     `gorm:"type:varchar(50)"`
	DeviceID   string     `gorm:"type:varchar(255);not null"`
	FCMToken   string     `gorm:"type:text"`
	IsActive   bool       `gorm:"not null;default:true"`
	LastSyncAt *time.Time
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func (Device) TableName() string {
	return "devices"
}

type DeviceRepository interface {
	Create(device *Device) error
	FindByID(id string) (*Device, error)
	FindByDeviceID(deviceID string) (*Device, error)
	FindByTenant(tenantID string) ([]Device, error)
	FindByCompany(companyID string) ([]Device, error)
	FindActiveByBranch(branchID string) ([]Device, error)
	Update(device *Device) error
	Delete(id string) error
	DeactivateByUser(userID string) error
}
