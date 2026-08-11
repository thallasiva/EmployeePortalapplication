#!/bin/bash
set -e

echo "========================================"
echo "  HRMS Frontend Deploy → S3 natsofthrms"
echo "========================================"

S3_BUCKET="natsofthrms"
REGION="us-east-1"    # change if your bucket is in another region

# 1. Build
echo ""
echo "[1/3] Building React app for production..."
npm run build

# 2. Sync to S3
echo ""
echo "[2/3] Uploading to S3 bucket: $S3_BUCKET..."
aws s3 sync build/ s3://$S3_BUCKET \
  --delete \
  --region $REGION \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html"

# Upload index.html separately with no-cache
aws s3 cp build/index.html s3://$S3_BUCKET/index.html \
  --region $REGION \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html"

echo ""
echo "[3/3] Invalidating CloudFront cache (if distribution exists)..."
DIST_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[?DomainName=='${S3_BUCKET}.s3.amazonaws.com']].Id" \
  --output text 2>/dev/null || echo "")

if [ -n "$DIST_ID" ]; then
  aws cloudfront create-invalidation \
    --distribution-id "$DIST_ID" \
    --paths "/*"
  echo "CloudFront invalidation triggered: $DIST_ID"
else
  echo "No CloudFront distribution found — skipping invalidation."
fi

echo ""
echo "✅ Frontend deployed successfully!"
echo "   URL: https://hrms.natsoft.io"
