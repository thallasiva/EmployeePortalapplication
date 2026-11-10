# Deploying the HRMS application to AWS

This project is a Create React App frontend and an Express/MySQL backend. A suitable production setup is:

```text
Browser → CloudFront → private S3 bucket (React files)
Browser → HTTPS API domain → Nginx on EC2 → Express API → private RDS for MySQL
                                             └──────────→ S3 for persistent uploads
```

The repository includes a GitHub Actions workflow at `.github/workflows/hrms-production.yml`. It can deploy the frontend to S3 and invalidate CloudFront. Its backend job is **not a complete deployment yet**: it uploads an archive and sends an SSM command that only prints a message. Use the manual backend steps below until that command is replaced with real install/restart commands.

## 1. Create AWS resources

Use one AWS region consistently. The current workflow sets `ap-southeast-2` and a specific EC2 instance ID; change those values in the workflow if your resources are elsewhere.

1. **RDS MySQL**: Create a MySQL database in private subnets. Allow inbound port `3306` only from the EC2 security group. Enable automated backups and do not expose the database publicly.
2. **EC2 for the API**: Create an Ubuntu instance, attach an instance role with Systems Manager access, and use SSM Session Manager instead of opening SSH to the internet. Allow inbound HTTPS from the internet to the API through Nginx; keep port `5000` private to the instance.
3. **S3 for the frontend**: Create a bucket for the React build. Keep S3 Block Public Access enabled.
4. **CloudFront for the frontend**: Create a distribution with the S3 bucket as its origin and Origin Access Control (OAC). Set the default root object to `index.html`. Configure 403 and 404 responses to return `/index.html` with status `200` so React Router routes load directly.
5. **S3 for uploads**: Create a separate private bucket for uploaded documents and configure the backend to store files there. The app's current local `backend/uploads` storage is not a durable deployment strategy.
6. **Domains and TLS**: Point a frontend domain to CloudFront and an API domain to the API endpoint (prefer an Application Load Balancer for a managed TLS endpoint; alternatively terminate TLS at Nginx with a certificate). Use HTTPS for both.

## 2. Configure and deploy the backend

On the EC2 instance, install a supported Node.js LTS version, Git, and a process manager such as PM2. Deploy the repository's `backend` directory, then run:

```bash
cd backend
npm ci --omit=dev
```

Set production environment variables through AWS Secrets Manager or Systems Manager Parameter Store, not a committed `.env` file:

```text
NODE_ENV=production
PORT=5000
CLIENT_ORIGIN=https://your-frontend-domain
FRONTEND_URL=https://your-frontend-domain
BACKEND_URL=https://your-api-domain
DB_HOST=<RDS endpoint>
DB_PORT=3306
DB_USER=<database user>
DB_PASSWORD=<database password>
DB_NAME=<database name>
DB_CONNECTION_LIMIT=10
JWT_SECRET=<strong random secret>
JWT_REFRESH_SECRET=<different strong random secret>
SALARY_ENCRYPTION_KEY=<existing 64-character hex key>
UPLOAD_DIR=uploads
MAX_UPLOAD_MB=10
```

Keep the original `SALARY_ENCRYPTION_KEY` if this database already contains encrypted salary data. Generating a new key can make existing values unreadable. Configure SMTP and any optional Google, Microsoft, Zoom, or OpenAI integrations only if the corresponding features are needed.

Run the app with PM2 (or another service manager) and configure it to restart after instance reboot. Configure Nginx to proxy HTTPS requests to `http://127.0.0.1:5000`. The app exposes health endpoints at `/health` and `/api/health`; verify one responds before configuring the frontend.

### Database setup and migrations

Take a database backup before applying schema changes. For a new database, review the SQL initialization sequence and seed data before running `npm run db:init` from `backend/`. For an existing database, apply only the pending migrations after testing them against a staging copy. In particular, the training/assets migrations are available as:

```bash
cd backend
npm run db:migrate:063
npm run db:migrate:064
```

Run those commands with the production database variables set only when those migrations are pending. Verify the migration results and API health before directing users to the new deployment.

## 3. Build and deploy the frontend

In PowerShell at the repository root, set the API URL and build:

```powershell
$env:REACT_APP_API_URL = "https://your-api-domain/api"
npm ci
npm run build
```

Install and configure the AWS CLI with an identity that can write to the frontend bucket and create CloudFront invalidations. Then publish the static files:

```powershell
aws s3 sync build/ s3://YOUR_FRONTEND_BUCKET/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

Do not upload `.env` files or backend secrets to the frontend bucket. React build-time variables are included in browser assets, so they must never contain credentials.

## 4. Configure GitHub Actions deployment

The existing workflow triggers on pushes to `main`. Before enabling it:

1. Create a GitHub Actions OIDC identity provider in AWS and an IAM deployment role trusted only by this repository and its production branch/environment.
2. Add the role ARN as the GitHub production environment secret `AWS_DEPLOY_ROLE_ARN`.
3. Add these GitHub production environment variables: `REACT_APP_API_URL`, `FRONTEND_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, and `DEPLOY_BUCKET`.
4. Restrict the IAM role to the required S3 upload, CloudFront invalidation, SSM command, and artifact bucket actions.
5. Update the workflow's region and EC2 instance ID to match your resources.
6. Implement and test the backend SSM deployment command before relying on the workflow for backend releases. It must fetch and unpack the artifact, install production dependencies, load secrets securely, and restart the API process. The current command does none of these.

The workflow runs frontend tests/builds before deploying. Test the deployment in a staging environment first, then use a reviewed push to `main` for production.

## 5. Verify the deployment

- Open the frontend over HTTPS and test a direct React Router URL as well as the home page.
- Request `https://your-api-domain/api/health`.
- Sign in and test one read and one write flow.
- Check browser network errors for incorrect `REACT_APP_API_URL` or CORS settings. `CLIENT_ORIGIN` must exactly match the frontend origin, without a trailing slash.
- Check EC2/PM2 and Nginx logs, RDS connectivity, CloudFront logs, and S3 upload permissions if a request fails.

## Security note

Do not use the existing `deploy-backend.sh` as-is: it contains hard-coded sensitive values. Rotate any real credentials it contains, remove secrets from tracked files and deployment history as appropriate, and use Secrets Manager/Parameter Store and GitHub OIDC instead. Never paste production secrets into source code, GitHub workflow files, or this guide.
