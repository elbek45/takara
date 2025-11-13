# Takara DeFi - DigitalOcean App Platform Deployment Guide

Complete step-by-step guide for deploying Takara DeFi to DigitalOcean App Platform.

**Status**: Ready for deployment
**GitHub Repository**: https://github.com/elbek45/takara
**Last Updated**: 2025-11-13

---

## 📋 Prerequisites

- DigitalOcean account: https://cloud.digitalocean.com
- GitHub account with access to: https://github.com/elbek45/takara
- Domain name (optional, can use *.ondigitalocean.app subdomain)

---

## 💰 Cost Estimate

**DigitalOcean App Platform Pricing** (as of 2024):

| Component | Plan | Cost |
|-----------|------|------|
| Backend | Basic ($5/mo) | $5/month |
| Frontend | Static Site | $0/month (free) |
| PostgreSQL Database | Basic ($15/mo) | $15/month |
| **Total** | | **$20/month** |

Scale up as needed:
- Professional Backend: $12/mo (more resources)
- Professional Database: $30/mo (more storage/connections)

---

## 🚀 Deployment Steps

### Step 1: Create PostgreSQL Database

1. Go to: https://cloud.digitalocean.com/databases
2. Click **"Create Database Cluster"**
3. Configure:
   - **Database Engine**: PostgreSQL 16
   - **Plan**: Basic ($15/mo) - 1 GB RAM, 10 GB Disk
   - **Datacenter**: Choose closest to your users (e.g., New York, San Francisco)
   - **Database Name**: `takara-production`
4. Click **"Create Database Cluster"**
5. Wait 3-5 minutes for provisioning

**Save these connection details** (you'll need them):
- Host
- Port
- Database name
- Username
- Password
- Connection string

---

### Step 2: Deploy Backend API

#### 2.1. Create Backend App

1. Go to: https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Select **"GitHub"** as source
4. **Authorize DigitalOcean** to access your GitHub account
5. Select repository: **elbek45/takara**
6. Select branch: **main**
7. **Enable "Autodeploy"** (redeploy on git push)

#### 2.2. Configure Backend Settings

**Resources Configuration:**

```
Source Directory: /backend
Type: Web Service
Name: takara-backend
Region: Same as database (e.g., New York)

Build Phase:
  Build Command: npm install && npx prisma generate && npm run build

Run Phase:
  Run Command: npm start

HTTP Port: 5000
HTTP Routes: /api
```

**Environment Variables** - Add these in the app settings:

```bash
# App Configuration
NODE_ENV=production
PORT=5000

# Database (from Step 1)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# JWT Configuration (generate new secret!)
JWT_SECRET=<GENERATE_STRONG_SECRET_HERE>

# Solana Configuration (for devnet testing)
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# For mainnet (after token deployment):
# SOLANA_NETWORK=mainnet-beta
# SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# TAKARA_TOKEN_MINT=<YOUR_TOKEN_ADDRESS>
# USDT_TOKEN_MINT=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB

# CORS Configuration
CORS_ORIGIN=https://your-frontend-app.ondigitalocean.app

# Admin Configuration
ADMIN_EMAIL=admin@takara.io
ADMIN_PASSWORD=<GENERATE_STRONG_PASSWORD>
```

**Generate Strong Secrets:**

```bash
# Generate JWT secret (run locally)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use this online: https://generate-secret.now.sh/64
```

#### 2.3. Connect Database to Backend

1. In app settings, go to **"Components" → "takara-backend"**
2. Scroll to **"Trusted Sources"**
3. Click **"Add Trusted Source"**
4. Select your **takara-production** database
5. This adds the database to the app's VPC and sets `DATABASE_URL`

#### 2.4. Deploy Backend

1. Review settings
2. Click **"Create Resources"**
3. Wait 5-10 minutes for initial deployment
4. Monitor build logs for errors

#### 2.5. Run Database Migrations

**After first deployment**, you need to run Prisma migrations:

**Option A: Via DigitalOcean Console**

1. Go to your backend app
2. Click **"Console"** tab
3. Click **"Launch Console"**
4. Run:
```bash
npx prisma migrate deploy
npx prisma db seed  # Optional: seed initial data
```

**Option B: Via Local Machine**

```bash
# Set production database URL locally
export DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"

# Run migrations
cd /home/elbek/Takara/backend
npx prisma migrate deploy
npx prisma db seed  # Optional: seed initial data
```

**Verify Backend is Running:**

Visit: `https://takara-backend-xxxxx.ondigitalocean.app/api/health`

You should see: `{"status": "ok"}`

---

### Step 3: Deploy Frontend

#### 3.1. Create Frontend App

1. Go to: https://cloud.digitalocean.com/apps
2. Click **"Create App"** (or add component to existing app)
3. Select **"GitHub"** source
4. Repository: **elbek45/takara**
5. Branch: **main**
6. **Enable "Autodeploy"**

#### 3.2. Configure Frontend Settings

**Resources Configuration:**

```
Source Directory: /frontend
Type: Static Site
Name: takara-frontend
Region: Same as backend

Build Phase:
  Build Command: npm install && npm run build

Output Directory: dist

HTTP Routes: /
```

**Environment Variables:**

```bash
# API Configuration
VITE_API_URL=https://takara-backend-xxxxx.ondigitalocean.app/api

# Solana Configuration (devnet for testing)
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com

# For mainnet (after token deployment):
# VITE_SOLANA_NETWORK=mainnet-beta
# VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# VITE_TAKARA_TOKEN_MINT=<YOUR_TOKEN_ADDRESS>
# VITE_USDT_TOKEN_MINT=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB

# App Information
VITE_APP_NAME=Takara DeFi Platform
VITE_APP_URL=https://takara-frontend-xxxxx.ondigitalocean.app

# Feature Flags
VITE_ENABLE_ADMIN_PANEL=true
VITE_ENABLE_WITHDRAWALS=true
VITE_MAINTENANCE_MODE=false
```

**Replace `takara-backend-xxxxx`** with your actual backend URL from Step 2.

#### 3.3. Deploy Frontend

1. Review settings
2. Click **"Create Resources"** (or "Add Component")
3. Wait 5-10 minutes for deployment
4. Monitor build logs

**Verify Frontend is Running:**

Visit: `https://takara-frontend-xxxxx.ondigitalocean.app`

You should see the Takara DeFi homepage.

---

### Step 4: Update Backend CORS

After frontend deployment, update backend CORS:

1. Go to backend app settings
2. Update **CORS_ORIGIN** environment variable:
```bash
CORS_ORIGIN=https://takara-frontend-xxxxx.ondigitalocean.app
```
3. Save and redeploy backend

---

### Step 5: Deploy Admin Panel (Optional)

#### 5.1. Create Admin App

1. Go to: https://cloud.digitalocean.com/apps
2. Add component to existing app or create new
3. Repository: **elbek45/takara**
4. Branch: **main**

#### 5.2. Configure Admin Settings

```
Source Directory: /admin-panel
Type: Static Site
Name: takara-admin
Region: Same as backend

Build Command: npm install && npm run build
Output Directory: dist
HTTP Routes: /admin
```

**Environment Variables:**

```bash
VITE_API_URL=https://takara-backend-xxxxx.ondigitalocean.app/api
VITE_APP_NAME=Takara DeFi Admin Panel
```

#### 5.3. Deploy Admin Panel

1. Create resources
2. Wait for deployment
3. Access at: `https://takara-admin-xxxxx.ondigitalocean.app`

---

## 🔐 Security Configuration

### 1. Enable HTTPS (Automatic)

DigitalOcean App Platform automatically provisions SSL certificates for all apps. No action needed!

### 2. Restrict Database Access

1. Go to your database cluster
2. Navigate to **"Settings" → "Trusted Sources"**
3. **Remove "All IP addresses"** if enabled
4. **Add only**:
   - Your backend app
   - Your local IP (for migrations/management)

### 3. Set Strong Passwords

Ensure these are strong and unique:
- Database password
- JWT secret
- Admin account password

### 4. Environment Variables

- Never commit `.env` files to GitHub
- Use DigitalOcean's environment variable management
- Rotate secrets periodically

---

## 🔄 Custom Domain Setup

### Option A: Use DigitalOcean DNS

If your domain is managed by DigitalOcean:

1. Go to **"Networking" → "Domains"**
2. Add your domain
3. In your app settings, go to **"Settings" → "Domains"**
4. Add custom domain: `takara.io`
5. Follow DNS configuration instructions
6. SSL certificate auto-provisions

### Option B: External DNS Provider

If your domain is elsewhere (Cloudflare, GoDaddy, etc.):

1. In app settings, add custom domain
2. DigitalOcean provides DNS records:
   ```
   Type: CNAME
   Name: @
   Value: <your-app>.ondigitalocean.app
   ```
3. Add these records to your DNS provider
4. Wait for DNS propagation (5-60 minutes)
5. SSL certificate auto-provisions

**Recommended Domain Structure:**

```
https://takara.io              → Frontend
https://api.takara.io          → Backend API
https://admin.takara.io        → Admin Panel
```

---

## 📊 Monitoring & Logs

### View Application Logs

1. Go to your app in DigitalOcean
2. Click **"Runtime Logs"** tab
3. Select component (backend/frontend)
4. View real-time logs

### Monitor Performance

1. Go to **"Insights"** tab
2. View:
   - CPU usage
   - Memory usage
   - Request count
   - Response times
   - Error rates

### Set Up Alerts

1. Go to **"Settings" → "Alerts"**
2. Configure alerts for:
   - High error rate
   - Resource exhaustion
   - Deployment failures

---

## 🧪 Testing After Deployment

### 1. Test Backend API

```bash
# Health check
curl https://takara-backend-xxxxx.ondigitalocean.app/api/health

# Register test user
curl -X POST https://takara-backend-xxxxx.ondigitalocean.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "username": "testuser"
  }'

# Login
curl -X POST https://takara-backend-xxxxx.ondigitalocean.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### 2. Test Frontend

1. Visit: `https://takara-frontend-xxxxx.ondigitalocean.app`
2. Verify:
   - [ ] Homepage loads correctly
   - [ ] Connect Phantom wallet works
   - [ ] Pools page displays
   - [ ] Investment flow functional
   - [ ] Responsive on mobile
   - [ ] No console errors

### 3. Test Admin Panel

1. Visit: `https://takara-admin-xxxxx.ondigitalocean.app`
2. Login with admin credentials
3. Verify:
   - [ ] User management works
   - [ ] Pool management works
   - [ ] Withdrawals approval works

---

## 🔄 CI/CD - Automatic Deployments

**Already Configured!** Since you enabled "Autodeploy":

1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   cd /home/elbek/Takara
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. DigitalOcean automatically:
   - Detects the push
   - Runs build
   - Deploys new version
   - Zero downtime deployment

**Monitor Deployments:**
- Go to **"Activity"** tab in your app
- View deployment history and logs

---

## 🚨 Troubleshooting

### Backend Build Fails

**Issue**: `Prisma generate failed`

**Solution**:
```bash
# Add to build command:
npm install && npx prisma generate && npm run build
```

**Issue**: `DATABASE_URL not found`

**Solution**: Ensure database is added to "Trusted Sources" in backend settings.

### Frontend Build Fails

**Issue**: `VITE_API_URL is undefined`

**Solution**: Add all `VITE_*` environment variables in frontend settings.

**Issue**: Build succeeds but page is blank

**Solution**:
1. Check browser console for errors
2. Verify `VITE_API_URL` points to correct backend
3. Check CORS settings in backend

### Database Connection Issues

**Issue**: `Can't reach database`

**Solution**:
1. Verify database cluster is running
2. Check "Trusted Sources" includes backend app
3. Verify `DATABASE_URL` format:
   ```
   postgresql://user:pass@host:port/db?sslmode=require
   ```

### Wallet Connection Issues

**Issue**: Phantom wallet not connecting

**Solution**:
1. Ensure using HTTPS (DigitalOcean apps always use HTTPS)
2. Check `VITE_SOLANA_NETWORK` is set correctly
3. Verify `VITE_SOLANA_RPC_URL` is accessible

---

## 📈 Scaling

### Increase Backend Resources

When you need more power:

1. Go to backend component settings
2. Navigate to **"Resources"**
3. Upgrade plan:
   - **Basic**: $5/mo - 512 MB RAM
   - **Professional**: $12/mo - 1 GB RAM
   - **Pro Plus**: $50/mo - 2 GB RAM

### Database Scaling

When you need more storage/connections:

1. Go to database cluster
2. Navigate to **"Resize"**
3. Upgrade plan:
   - **Basic**: $15/mo - 1 GB RAM, 10 GB Disk
   - **Professional**: $30/mo - 2 GB RAM, 25 GB Disk
   - **Advanced**: $60/mo - 4 GB RAM, 50 GB Disk

### Enable Autoscaling (Advanced Plans)

For Professional tier and above:
1. Go to component settings
2. Enable **"Autoscaling"**
3. Set min/max instances
4. Set target CPU/memory thresholds

---

## 🎯 Production Checklist

Before going live on mainnet:

- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Database migrations completed
- [ ] Admin panel deployed (if needed)
- [ ] Custom domain configured (optional)
- [ ] SSL certificates active (automatic)
- [ ] Environment variables set for production
- [ ] CORS configured correctly
- [ ] Database backups enabled (automatic)
- [ ] Monitoring and alerts configured
- [ ] TAKARA token deployed on Solana mainnet
- [ ] Update environment variables with mainnet addresses
- [ ] Test end-to-end user flow
- [ ] Load testing completed
- [ ] Security audit completed

---

## 🔄 Backup & Recovery

### Database Backups

**DigitalOcean automatically backs up databases daily** for managed databases.

**Manual Backup:**

```bash
# Set database URL
export DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"

# Backup locally
pg_dump $DATABASE_URL > takara_backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < takara_backup_20251113.sql
```

### Application Rollback

If deployment fails:

1. Go to **"Activity"** tab
2. Find previous successful deployment
3. Click **"Rollback"**
4. Confirm rollback

---

## 💡 Best Practices

### 1. Use Environment-Specific Branches

```
main        → Production deployment
staging     → Staging environment
develop     → Development
```

Configure DigitalOcean apps to deploy from respective branches.

### 2. Enable Build Caching

In build settings, enable **"Build Cache"** to speed up deployments.

### 3. Monitor Costs

1. Go to **"Billing"** dashboard
2. Set up **"Billing Alerts"**
3. Monitor usage regularly

### 4. Regular Updates

Keep dependencies updated:

```bash
cd /home/elbek/Takara
npm update
git commit -am "Update dependencies"
git push
```

### 5. Database Maintenance

- Monitor connection pool usage
- Optimize slow queries
- Regular VACUUM (automatic with managed DB)

---

## 📚 Additional Resources

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [PostgreSQL on DigitalOcean](https://docs.digitalocean.com/products/databases/postgresql/)
- [Node.js Deployment Guide](https://docs.digitalocean.com/tutorials/deploy-nodejs-app/)
- [Custom Domains Setup](https://docs.digitalocean.com/products/app-platform/how-to/manage-domains/)

---

## 🆘 Support

**DigitalOcean Support:**
- Community Forum: https://www.digitalocean.com/community
- Support Tickets: https://cloud.digitalocean.com/support

**Takara DeFi Issues:**
- GitHub Issues: https://github.com/elbek45/takara/issues

---

## 🎉 Next Steps

After deployment:

1. **Test thoroughly** in devnet environment
2. **Deploy TAKARA token** to Solana mainnet (see MAINNET_MIGRATION_GUIDE.md)
3. **Update environment variables** with mainnet addresses
4. **Announce launch** to community
5. **Monitor closely** for first 24-48 hours

---

**Version**: 1.0.0
**Last Updated**: 2025-11-13
**Status**: Production Ready ✅
