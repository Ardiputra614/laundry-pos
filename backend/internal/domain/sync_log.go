package domain

import "time"

type SyncStatus string

const (
	SyncStatusPending SyncStatus = "pending"
	SyncStatusSyncing SyncStatus = "syncing"
	SyncStatusSuccess SyncStatus = "success"
	SyncStatusFailed  SyncStatus = "failed"
)

type SyncType string

const (
	SyncTypePush SyncType = "push"
	SyncTypePull SyncType = "pull"
)

type SyncLog struct {
	ID            string     `gorm:"type:char(36);primaryKey"`
	TenantID      string     `gorm:"type:char(36);index;not null"`
	CompanyID     string     `gorm:"type:char(36);index;not null"`
	DeviceID      string     `gorm:"type:char(36);index"`
	EntityTable   string     `gorm:"type:varchar(100);not null"`
	SyncType      SyncType   `gorm:"type:varchar(10);not null"`
	Status        SyncStatus `gorm:"type:varchar(10);not null;default:'pending'"`
	RecordsCount  int        `gorm:"not null;default:0"`
	ErrorMessage  string     `gorm:"type:text"`
	SyncedAt      *time.Time
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (SyncLog) TableName() string {
	return "sync_logs"
}

type SyncLogRepository interface {
	Create(log *SyncLog) error
	FindByID(id string) (*SyncLog, error)
	FindByTenant(tenantID string, page, limit int) ([]SyncLog, int64, error)
	FindByDevice(deviceID string, page, limit int) ([]SyncLog, int64, error)
	Update(log *SyncLog) error
}
