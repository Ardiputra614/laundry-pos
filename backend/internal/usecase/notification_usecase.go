package usecase

import (
	"errors"
	"net/http"
	"time"

	"github.com/ardiputra/laundry-pos/internal/domain"
	"github.com/ardiputra/laundry-pos/internal/middleware"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NotificationUsecase struct {
	notifRepo domain.NotificationRepository
}

func NewNotificationUsecase(notifRepo domain.NotificationRepository) *NotificationUsecase {
	return &NotificationUsecase{notifRepo: notifRepo}
}

type CreateNotificationInput struct {
	Title         string
	Body          string
	Type          string
	Channel       string
	UserID        string
	ReferenceType string
	ReferenceID   string
}

func (uc *NotificationUsecase) Create(ctx *gin.Context, input CreateNotificationInput) (*domain.Notification, int, error) {
	tenantID := middleware.GetTenantID(ctx)
	companyID := middleware.GetCompanyID(ctx)

	notif := &domain.Notification{
		ID:            uuid.New().String(),
		TenantID:      tenantID,
		CompanyID:     companyID,
		UserID:        input.UserID,
		Title:         input.Title,
		Body:          input.Body,
		Type:          input.Type,
		Channel:       input.Channel,
		ReferenceType: input.ReferenceType,
		ReferenceID:   input.ReferenceID,
		IsRead:        false,
	}

	if notif.Type == "" {
		notif.Type = "info"
	}
	if notif.Channel == "" {
		notif.Channel = "in_app"
	}

	if err := uc.notifRepo.Create(notif); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return notif, http.StatusCreated, nil
}

func (uc *NotificationUsecase) List(ctx *gin.Context, page, limit int) ([]domain.Notification, int64, error) {
	userID := middleware.GetUserID(ctx)
	if userID == "" {
		return nil, 0, domain.ErrUnauthorized
	}

	return uc.notifRepo.FindByUser(userID, page, limit)
}

func (uc *NotificationUsecase) GetUnread(ctx *gin.Context) ([]domain.Notification, error) {
	userID := middleware.GetUserID(ctx)
	if userID == "" {
		return nil, domain.ErrUnauthorized
	}

	return uc.notifRepo.FindUnreadByUser(userID)
}

func (uc *NotificationUsecase) MarkAsRead(ctx *gin.Context, id string) (int, error) {
	notif, err := uc.notifRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, domain.ErrNotFound
		}
		return http.StatusInternalServerError, err
	}

	userID := middleware.GetUserID(ctx)
	if notif.UserID != userID {
		return http.StatusForbidden, domain.ErrForbidden
	}

	if err := uc.notifRepo.MarkAsRead(id); err != nil {
		return http.StatusInternalServerError, err
	}

	return http.StatusOK, nil
}

func (uc *NotificationUsecase) MarkAllAsRead(ctx *gin.Context) error {
	userID := middleware.GetUserID(ctx)
	if userID == "" {
		return domain.ErrUnauthorized
	}

	return uc.notifRepo.MarkAllAsRead(userID)
}

func (uc *NotificationUsecase) CountUnread(ctx *gin.Context) (int64, error) {
	userID := middleware.GetUserID(ctx)
	if userID == "" {
		return 0, domain.ErrUnauthorized
	}

	return uc.notifRepo.CountUnread(userID)
}

func (uc *NotificationUsecase) Delete(ctx *gin.Context, id string) (int, error) {
	notif, err := uc.notifRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, domain.ErrNotFound
		}
		return http.StatusInternalServerError, err
	}

	userID := middleware.GetUserID(ctx)
	if notif.UserID != userID {
		return http.StatusForbidden, domain.ErrForbidden
	}

	if err := uc.notifRepo.Delete(id); err != nil {
		return http.StatusInternalServerError, err
	}

	return http.StatusOK, nil
}

// SendNotification creates a notification and returns it without requiring a gin context.
// Useful for notification dispatch from workers or other usecases.
func (uc *NotificationUsecase) SendNotification(tenantID, companyID, userID, title, body, notifType, channel, refType, refID string) (*domain.Notification, error) {
	if notifType == "" {
		notifType = "info"
	}
	if channel == "" {
		channel = "in_app"
	}

	now := time.Now()
	notif := &domain.Notification{
		ID:            uuid.New().String(),
		TenantID:      tenantID,
		CompanyID:     companyID,
		UserID:        userID,
		Title:         title,
		Body:          body,
		Type:          notifType,
		Channel:       channel,
		ReferenceType: refType,
		ReferenceID:   refID,
		IsRead:        false,
		CreatedAt:     now,
	}

	if err := uc.notifRepo.Create(notif); err != nil {
		return nil, err
	}

	return notif, nil
}
