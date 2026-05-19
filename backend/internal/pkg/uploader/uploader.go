package uploader

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type Uploader struct {
	client *minio.Client
	bucket string
}

func New(endpoint, accessKey, secretKey, bucket string, useSSL bool) (*Uploader, error) {
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, err
	}

	ctx := context.Background()
	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return nil, err
	}
	if !exists {
		err = client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{})
		if err != nil {
			return nil, err
		}
	}

	return &Uploader{client: client, bucket: bucket}, nil
}

func (u *Uploader) Upload(ctx context.Context, file io.Reader, filename string, size int64, contentType string) (string, error) {
	ext := filepath.Ext(filename)
	objectName := fmt.Sprintf("%s/%s%s", time.Now().Format("2006/01/02"), uuid.New().String(), ext)

	_, err := u.client.PutObject(ctx, u.bucket, objectName, file, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("%s/%s/%s", u.client.EndpointURL().String(), u.bucket, objectName), nil
}

func (u *Uploader) Delete(ctx context.Context, objectName string) error {
	return u.client.RemoveObject(ctx, u.bucket, objectName, minio.RemoveObjectOptions{})
}
