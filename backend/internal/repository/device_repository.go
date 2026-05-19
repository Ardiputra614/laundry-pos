package repository

import (
	"github.com/ardiputra/laundry-pos/internal/domain"
	"gorm.io/gorm"
)

type deviceRepository struct {
	db *gorm.DB
}

func NewDeviceRepository(db *gorm.DB) domain.DeviceRepository {
	return &deviceRepository{db: db}
}

func (r *deviceRepository) Create(device *domain.Device) error {
	return r.db.Create(device).Error
}

func (r *deviceRepository) FindByID(id string) (*domain.Device, error) {
	var device domain.Device
	err := r.db.Where("id = ?", id).First(&device).Error
	if err != nil {
		return nil, err
	}
	return &device, nil
}

func (r *deviceRepository) FindByDeviceID(deviceID string) (*domain.Device, error) {
	var device domain.Device
	err := r.db.Where("device_id = ?", deviceID).First(&device).Error
	if err != nil {
		return nil, err
	}
	return &device, nil
}

func (r *deviceRepository) FindByTenant(tenantID string) ([]domain.Device, error) {
	var devices []domain.Device
	err := r.db.Where("tenant_id = ?", tenantID).Order("created_at DESC").Find(&devices).Error
	if err != nil {
		return nil, err
	}
	return devices, nil
}

func (r *deviceRepository) FindByCompany(companyID string) ([]domain.Device, error) {
	var devices []domain.Device
	err := r.db.Where("company_id = ?", companyID).Order("created_at DESC").Find(&devices).Error
	if err != nil {
		return nil, err
	}
	return devices, nil
}

func (r *deviceRepository) FindActiveByBranch(branchID string) ([]domain.Device, error) {
	var devices []domain.Device
	err := r.db.Where("branch_id = ? AND is_active = ?", branchID, true).Order("created_at DESC").Find(&devices).Error
	if err != nil {
		return nil, err
	}
	return devices, nil
}

func (r *deviceRepository) Update(device *domain.Device) error {
	return r.db.Save(device).Error
}

func (r *deviceRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.Device{}).Error
}

func (r *deviceRepository) DeactivateByUser(userID string) error {
	return r.db.Model(&domain.Device{}).Where("user_id = ?", userID).Update("is_active", false).Error
}
