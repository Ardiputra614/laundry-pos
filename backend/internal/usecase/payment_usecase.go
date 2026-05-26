package usecase

import (
	"errors"
	"fmt"
	"log"
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
	var invoiceNumber string
	if len(req.OrderID) > 4 && req.OrderID[:4] == "SUB-" {
		invoiceNumber = req.OrderID
	}

	log.Printf("[Webhook] Request: order_id=%s, status=%s, invoice_prefix=%s", req.OrderID, req.TransactionStatus, invoiceNumber)

	existing, err := uc.paymentRepo.FindByMidtransTransactionID(req.TransactionID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return http.StatusInternalServerError, err
	}

	if existing != nil {
		log.Printf("[Webhook] Existing payment %s, status=%s", req.TransactionID, req.TransactionStatus)
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

		if existing.Status == domain.PaySuccess && invoiceNumber != "" {
			if err := uc.activateSubscriptionFromInvoice(invoiceNumber, req.PaymentType); err != nil {
				log.Printf("[Webhook] Subscription activation failed: %v", err)
				return http.StatusInternalServerError, err
			}
		}

		return http.StatusOK, nil
	}

	now := time.Now()

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
		log.Printf("[Webhook] Failed to create payment: %v", err)
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
			if err := uc.activateSubscriptionFromInvoice(invoiceNumber, req.PaymentType); err != nil {
				log.Printf("[Webhook] Subscription activation failed: %v", err)
				return http.StatusInternalServerError, err
			}
		}
	}

	return http.StatusOK, nil
}

func (uc *PaymentUsecase) activateSubscriptionFromInvoice(invoiceNumber, paymentMethod string) error {
	log.Printf("[Webhook] Activating subscription from invoice %s", invoiceNumber)

	invoice, err := uc.invoiceRepo.FindByInvoiceNumber(invoiceNumber)
	if err != nil {
		log.Printf("[Webhook] Invoice %s not found: %v", invoiceNumber, err)
		return fmt.Errorf("invoice %s not found: %w", invoiceNumber, err)
	}
	log.Printf("[Webhook] Found invoice %s, sub_id=%s", invoice.InvoiceNumber, invoice.SubscriptionID)

	now := time.Now()
	invoice.Status = "paid"
	invoice.PaidAt = &now
	invoice.PaymentMethod = paymentMethod
	if err := uc.invoiceRepo.Update(invoice); err != nil {
		log.Printf("[Webhook] Failed to update invoice: %v", err)
		return fmt.Errorf("update invoice: %w", err)
	}

	if invoice.SubscriptionID == "" {
		log.Printf("[Webhook] Invoice %s has no subscription ID, skipping", invoiceNumber)
		return fmt.Errorf("invoice %s has no subscription id", invoiceNumber)
	}

	sub, err := uc.subRepo.FindByID(invoice.SubscriptionID)
	if err != nil {
		log.Printf("[Webhook] Subscription %s not found: %v", invoice.SubscriptionID, err)
		return fmt.Errorf("subscription %s not found: %w", invoice.SubscriptionID, err)
	}
	log.Printf("[Webhook] Found sub %s, status=%s, company_id=%s", sub.ID, sub.Status, sub.CompanyID)

	sub.Status = "active"
	periodEnd := now.AddDate(0, 1, 0)
	if sub.BillingCycle == "yearly" {
		periodEnd = now.AddDate(1, 0, 0)
	}
	sub.CurrentPeriodStart = &now
	sub.CurrentPeriodEnd = &periodEnd
	if err := uc.subRepo.Update(sub); err != nil {
		log.Printf("[Webhook] Failed to update subscription: %v", err)
		return fmt.Errorf("update subscription: %w", err)
	}
	log.Printf("[Webhook] Subscription %s updated to active", sub.ID)

	company, err := uc.companyRepo.FindByID(sub.CompanyID)
	if err != nil {
		log.Printf("[Webhook] Company %s not found: %v", sub.CompanyID, err)
		return fmt.Errorf("company %s not found: %w", sub.CompanyID, err)
	}
	log.Printf("[Webhook] Found company %s, current sub_status=%s", company.ID, company.SubStatus)

	plan, err := uc.planRepo.FindByID(sub.PlanID)
	if err == nil {
		company.Plan = domain.PlanType(plan.Code)
		company.MaxUsers = plan.MaxUsers
		company.MaxBranches = plan.MaxBranches
	}
	company.SubStatus = domain.SubActive
	company.SubExpiresAt = &periodEnd
	if err := uc.companyRepo.Update(company); err != nil {
		log.Printf("[Webhook] Failed to update company: %v", err)
		return fmt.Errorf("update company: %w", err)
	}
	log.Printf("[Webhook] Company %s subscription activated successfully", company.ID)
	return nil
}
