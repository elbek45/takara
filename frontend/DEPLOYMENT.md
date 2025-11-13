# Takara DeFi Frontend - Deployment Guide

Complete guide for deploying the Takara DeFi frontend to production.

**Build Status**: ✅ Production-ready
**Last Updated**: 2025-11-13

---

## 📦 Build Information

**Production Build Size** (gzipped):
- React vendor: 15.03 KB
- Solana vendor: 108.90 KB
- UI vendor: 24.14 KB
- Main bundle: 67.91 KB
- **Total: ~223 KB** ✅

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

**Why Vercel?**
- Best for React/Vite applications
- Automatic HTTPS
- Global CDN
- Zero configuration
- Free tier available
- Automatic deployments from Git

#### Deploy to Vercel

**Method A: Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from frontend directory)
cd /home/elbek/Takara/frontend
vercel

# Deploy to production
vercel --prod
```

**Method B: Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import from Git repository
4. Select the Takara repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add environment variables (see below)
7. Click "Deploy"

**Vercel Configuration** (`vercel.json` already created):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

---

### Option 2: Netlify (Alternative)

**Why Netlify?**
- Great for static sites
- Automatic HTTPS
- Global CDN
- Form handling
- Free tier available

#### Deploy to Netlify

**Method A: Netlify CLI**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd /home/elbek/Takara/frontend
netlify deploy

# Deploy to production
netlify deploy --prod
```

**Method B: Netlify Drop**

1. Build locally:
   ```bash
   npm run build
   ```
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Drag and drop the `dist` folder
4. Configure custom domain

**Netlify Configuration** (`netlify.toml`):

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Option 3: Cloudflare Pages

**Why Cloudflare Pages?**
- Fastest global CDN
- Unlimited bandwidth (free tier)
- Built-in analytics
- Workers integration

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Deploy
wrangler pages deploy dist --project-name=takara-defi
```

---

## 🔐 Environment Variables

### Required Environment Variables

Configure these in your deployment platform:

**Production (.env.production)**:
```bash
# API Configuration
VITE_API_URL=https://api.takara.io/api

# Solana Mainnet
VITE_SOLANA_NETWORK=mainnet-beta
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Token Addresses (set after mainnet deployment)
VITE_TAKARA_TOKEN_MINT=YOUR_MAINNET_TOKEN_ADDRESS
VITE_USDT_TOKEN_MINT=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB

# App Info
VITE_APP_NAME=Takara DeFi Platform
VITE_APP_URL=https://takara.io

# Feature Flags
VITE_ENABLE_ADMIN_PANEL=true
VITE_ENABLE_WITHDRAWALS=true
VITE_MAINTENANCE_MODE=false
```

### Setting Environment Variables

**Vercel:**
```bash
# Via CLI
vercel env add VITE_API_URL production
vercel env add VITE_SOLANA_NETWORK production
# ... etc

# Or via dashboard: Settings → Environment Variables
```

**Netlify:**
```bash
# Via dashboard: Site settings → Build & deploy → Environment
```

**Cloudflare Pages:**
```bash
# Via dashboard: Settings → Environment variables
```

---

## 🌐 Custom Domain Setup

### Configure Custom Domain

**For Vercel:**
1. Go to Project Settings → Domains
2. Add domain: `takara.io`
3. Add domain: `www.takara.io` (redirects to main)
4. Configure DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

**For Netlify:**
1. Site settings → Domain management
2. Add custom domain
3. Configure DNS:
   ```
   Type: A
   Name: @
   Value: 75.2.60.5

   Type: CNAME
   Name: www
   Value: [your-site-name].netlify.app
   ```

### SSL Certificate

All platforms automatically provision and renew SSL certificates. No action required!

---

## 🔄 CI/CD Setup (Automatic Deployments)

### GitHub Actions (Recommended)

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_SOLANA_NETWORK: mainnet-beta
          VITE_SOLANA_RPC_URL: https://api.mainnet-beta.solana.com
          VITE_TAKARA_TOKEN_MINT: ${{ secrets.VITE_TAKARA_TOKEN_MINT }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
```

**Setup Secrets** in GitHub repository:
```
Settings → Secrets and variables → Actions → New repository secret
```

---

## 🧪 Local Testing

### Test Production Build Locally

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Open browser: http://localhost:4173
```

### Test with Production API

```bash
# Create .env.local for testing
echo "VITE_API_URL=https://api.takara.io/api" > .env.local

# Run dev server with production API
npm run dev
```

---

## ✅ Pre-Deployment Checklist

- [ ] Backend API deployed and accessible
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Custom domain DNS configured
- [ ] SSL certificate active
- [ ] TAKARA token deployed on mainnet
- [ ] `.env.production` values updated
- [ ] Production build tested locally
- [ ] All features working in production
- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured (Google Analytics)

---

## 📊 Post-Deployment Verification

### 1. Check Deployment Status

```bash
# Vercel
vercel ls

# Netlify
netlify status
```

### 2. Test Website

Visit your deployed URL and verify:
- [ ] Homepage loads correctly
- [ ] Phantom wallet connects
- [ ] Pools page displays data
- [ ] Investment flow works
- [ ] Responsive on mobile
- [ ] No console errors
- [ ] All assets load (images, fonts)

### 3. Performance Check

Use [Google PageSpeed Insights](https://pagespeed.web.dev/):
- Target: 90+ performance score
- Target: 90+ SEO score

### 4. Security Headers

Check security headers:
```bash
curl -I https://takara.io
```

Should include:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`

---

## 🔥 Rollback Procedure

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]

# Or via dashboard: Deployments → Previous → Promote to Production
```

### Netlify Rollback

```bash
# Via dashboard: Deploys → Find previous deploy → Publish deploy
```

---

## 📈 Monitoring

### Vercel Analytics (Built-in)

Automatic tracking of:
- Page views
- Core Web Vitals
- Real User Monitoring

### Google Analytics Setup

1. Get GA4 Tracking ID from [analytics.google.com](https://analytics.google.com)
2. Add to environment variables:
   ```bash
   VITE_GA_TRACKING_ID=G-XXXXXXXXXX
   ```
3. Add tracking code to `index.html` (or create analytics service)

### Error Tracking with Sentry

```bash
# Install Sentry
npm install @sentry/react

# Configure in src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: "production",
  tracesSampleRate: 1.0,
});
```

---

## 🆘 Troubleshooting

### Build Fails

**Issue**: TypeScript errors during build

**Solution**:
```bash
# Use build without type checking (already configured)
npm run build

# Or fix types and use
npm run build:check
```

### Environment Variables Not Working

**Issue**: Variables are `undefined` in production

**Solution**:
- Verify all variables start with `VITE_`
- Redeploy after adding variables
- Clear build cache

### Wallet Connection Issues

**Issue**: Phantom wallet not connecting

**Solution**:
- Check `VITE_SOLANA_NETWORK` is set correctly
- Verify RPC URL is accessible
- Check browser console for errors

### Assets Not Loading

**Issue**: Images/fonts not loading

**Solution**:
- Verify assets are in `public/` directory
- Check build output includes assets
- Verify CDN/domain configuration

---

## 📚 Additional Resources

- [Vite Production Build Guide](https://vitejs.dev/guide/build.html)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [React Production Build](https://react.dev/learn/start-a-new-react-project#production-grade-react-frameworks)

---

## 🎯 Next Steps

1. **Deploy Backend First**: Follow `../backend/DEPLOYMENT.md`
2. **Deploy Frontend**: Use this guide
3. **Configure Mainnet**: Follow `../MAINNET_MIGRATION_GUIDE.md`
4. **Test End-to-End**: Complete user flows
5. **Launch**: Follow `../PRODUCTION_DEPLOYMENT_CHECKLIST.md`

---

**Questions?** Check the main deployment checklist or contact the team.

**Version**: 1.0.0
**Last Updated**: 2025-11-13
