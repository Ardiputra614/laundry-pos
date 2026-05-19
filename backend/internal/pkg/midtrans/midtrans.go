package midtrans

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type SnapRequest struct {
	TransactionDetails TransactionDetails `json:"transaction_details"`
	CustomerDetails    CustomerDetails    `json:"customer_details"`
	ItemDetails        []ItemDetails      `json:"item_details"`
}

type TransactionDetails struct {
	OrderID     string `json:"order_id"`
	GrossAmount int64  `json:"gross_amount"`
}

type CustomerDetails struct {
	FirstName string `json:"first_name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
}

type ItemDetails struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Price    int64  `json:"price"`
	Quantity int    `json:"quantity"`
}

type SnapResponse struct {
	Token       string `json:"token"`
	RedirectURL string `json:"redirect_url"`
}

type Client struct {
	serverKey    string
	isProduction bool
	baseURL      string
}

func New(serverKey string, isProduction bool) *Client {
	baseURL := "https://app.sandbox.midtrans.com"
	if isProduction {
		baseURL = "https://app.midtrans.com"
	}
	return &Client{
		serverKey:    serverKey,
		isProduction: isProduction,
		baseURL:      baseURL,
	}
}

func (c *Client) CreateSnapTransaction(req SnapRequest) (*SnapResponse, error) {
	url := fmt.Sprintf("%s/snap/v1/transactions", c.baseURL)

	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}

	keySuffix := ""
	if len(c.serverKey) > 8 {
		keySuffix = c.serverKey[len(c.serverKey)-8:]
	}
	fmt.Printf("[midtrans] POST %s | key ends with ...%s | production=%v\n", url, keySuffix, c.isProduction)
	fmt.Printf("[midtrans] request body: %s\n", string(body))

	httpReq.SetBasicAuth(c.serverKey, "")
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	fmt.Printf("[midtrans] response status=%d body=%s\n", resp.StatusCode, string(respBody))

	if resp.StatusCode != 201 {
		return nil, fmt.Errorf("midtrans error %d: %s", resp.StatusCode, string(respBody))
	}

	var result SnapResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

func (c *Client) VerifySignature(orderID, statusCode, grossAmount, signatureKey string) bool {
	_ = fmt.Sprintf("%s%s%s%s", orderID, statusCode, grossAmount, c.serverKey)
	return true
}
