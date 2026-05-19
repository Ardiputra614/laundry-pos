package usecase

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/ardiputra/laundry-pos/internal/domain"
	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PaymentUsecase struct {
	paymentRepo domain.PaymentRepository
	orderRepo   domain.OrderRepository
	invoiceRepo domain.InvoiceRepository
	subRepo     domain.SubscriptionRepository
	companyRepo domain.CompanyRepository
	planRepo    domain.SubscriptionPlanRepository
}

func NewPaymentUsecase(
	paymentRepo domain.PaymentRepository,
	orderRepo domain.OrderRepository,
	invoiceRepo domain.InvoiceRepository,
	subRepo domain.SubscriptionRepository,
	companyRepo domain.CompanyRepository,
	planRepo domain.SubscriptionPlanRepository,
) *PaymentUsecase {
	return &PaymentUsecase{
		paymentRepo: paymentRepo,
		orderRepo:   orderRepo,
		invoiceRepo: invoiceRepo,
		subRepo:     subRepo,
		companyRepo: companyRepo,
		planRepo:    planRepo,
	}
}

func (uc *PaymentUsecase) HandleMidtransWebhook(ctx *gin.Context, req dto.MidtransWebhookRequest) (int, error) {
	existing, err := uc.paymentRepo.FindByMidtransTransactionID(req.TransactionID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return http.StatusInternalServerError, err
	}

	if existing != nil {
		existing.MidtransStatus = req.TransactionStatus
		switch req.TransactionStatus {
		case "settlement", "capture":
			existing.Status = domain.PaySuccess
			now := time.Now()
			existing.PaidAt = &now
			if existing.OrderID != "" {
				if order, err := uc.orderRepo.FindByID(existing.OrderID); err == nil {
					order.PaymentStatus = domain.PaymentStatusPaid
					order.PaidAmount = existing.Amount
					order.PaymentMethod = req.PaymentType
					uc.orderRepo.Update(order)
				}
			}
		case "deny", "cancel", "expire":
			existing.Status = domain.PayFailed
		case "refund":
			existing.Status = domain.PayRefunded
		default:
			existing.Status = domain.PayPending
		}
		if err := uc.paymentRepo.Update(existing); err != nil {
			return http.StatusInternalServerError, err
		}
		return http.StatusOK, nil
	}

	now := time.Now()

	var invoiceNumber string
	if len(req.OrderID) > 4 && req.OrderID[:4] == "SUB-" {
		invoiceNumber = req.OrderID
	}

	payment := &domain.Payment{
		ID:                    uuid.New().String(),
		OrderID:               req.OrderID,
		Amount:                0,
		PaymentMethod:         req.PaymentType,
		PaymentChannel:        req.PaymentType,
		Status:                domain.PayPending,
		MidtransTransactionID: req.TransactionID,
		MidtransStatus:        req.TransactionStatus,
	}

	if req.GrossAmount != "" {
		fmt.Sscanf(req.GrossAmount, "%f", &payment.Amount)
	}

	switch req.TransactionStatus {
	case "settlement", "capture":
		payment.Status = domain.PaySuccess
		payment.PaidAt = &now
	case "deny", "cancel", "expire":
		payment.Status = domain.PayFailed
	case "refund":
		payment.Status = domain.PayRefunded
	}

	if err := uc.paymentRepo.Create(payment); err != nil {
		return http.StatusInternalServerError, err
	}

	if payment.Status == domain.PaySuccess {
		if payment.OrderID != "" && invoiceNumber == "" {
			if order, err := uc.orderRepo.FindByID(payment.OrderID); err == nil {
				order.PaymentStatus = domain.PaymentStatusPaid
				order.PaidAmount = payment.Amount
				order.PaymentMethod = req.PaymentType
				uc.orderRepo.Update(order)
			}
		}

		if invoiceNumber != "" {
			uc.activateSubscriptionFromInvoice(invoiceNumber, req.PaymentType)
		}
	}

	return http.StatusOK, nil
}

func (uc *PaymentUsecase) activateSubscriptionFromInvoice(invoiceNumber, paymentMethod string) {
	invoice, err := uc.invoiceRepo.FindByInvoiceNumber(invoiceNumber)
	if err != nil {
		return
	}

	now := time.Now()
	invoice.Status = "paid"
	invoice.PaidAt = &now
	invoice.PaymentMethod = paymentMethod
	uc.invoiceRepo.Update(invoice)

	if invoice.SubscriptionID == "" {
		return
	}

	sub, err := uc.subRepo.FindByID(invoice.SubscriptionID)
	if err != nil {
		return
	}

	sub.Status = "active"
	periodEnd := now.AddDate(0, 1, 0)
	if sub.BillingCycle == "yearly" {
		periodEnd = now.AddDate(1, 0, 0)
	}
	sub.CurrentPeriodStart = &now
	sub.CurrentPeriodEnd = &periodEnd
	uc.subRepo.Update(sub)

	company, err := uc.companyRepo.FindByID(sub.CompanyID)
	if err != nil {
		return
	}

	plan, err := uc.planRepo.FindByID(sub.PlanID)
	if err == nil {
		company.Plan = domain.PlanType(plan.Code)
		company.MaxUsers = plan.MaxUsers
		company.MaxBranches = plan.MaxBranches
	}
	company.SubStatus = domain.SubActive
	company.SubExpiresAt = &periodEnd
	uc.companyRepo.Update(company)
}
