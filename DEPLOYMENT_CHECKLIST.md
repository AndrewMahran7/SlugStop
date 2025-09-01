# 🚀 SlugStop Vercel Deployment Checklist

## ✅ Pre-Deployment Setup

### 1. MongoDB Atlas Setup
- [ ] Create MongoDB Atlas account (free)
- [ ] Create new cluster (M0 free tier)
- [ ] Create database user with read/write permissions
- [ ] Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/slugstop`
- [ ] Whitelist all IPs (0.0.0.0/0) for Vercel

### 2. Generate Secure Secrets
```bash
# Generate JWT Secret (copy the output)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate Session Secret (copy the output)
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Seed Database
```bash
# Set your Atlas connection string (replace with your actual URI)
set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/slugstop

# Create admin accounts
npm run setup-admin

# Seed METRO routes data  
npm run setup
```

## 🌐 Vercel Deployment

### 1. Deploy via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 2. Or Deploy via GitHub
1. Push code to GitHub repository
2. Connect GitHub account to Vercel
3. Import SlugStop repository
4. Configure environment variables
5. Deploy

## ⚙️ Vercel Environment Variables

Add these in your Vercel dashboard under **Settings > Environment Variables**:

| Variable | Value | Description |
|----------|--------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | Your Atlas connection string |
| `SESSION_SECRET` | `your-generated-secret` | Secure random string |
| `JWT_SECRET` | `your-generated-secret` | Secure random string |
| `NODE_ENV` | `production` | Environment mode |
| `VERCEL` | `true` | Serverless flag |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` | CORS origins |

## 🔧 Vercel Project Settings

### Build Configuration:
- **Framework Preset**: Other
- **Build Command**: `npm run build` (or leave empty)
- **Output Directory**: (leave empty)
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`
- **Root Directory**: `/`

## 🧪 Post-Deployment Testing

### 1. Test Core Routes
- [ ] Home: `https://your-app.vercel.app/`
- [ ] Bus Tracking: `https://your-app.vercel.app/track`
- [ ] Trip Planner: `https://your-app.vercel.app/trip-planner`
- [ ] Admin Login: `https://your-app.vercel.app/admin/login`

### 2. Test Admin System
- [ ] Login with: `admin@slugstop.com` / `admin123!@#`
- [ ] Access dashboard: `https://your-app.vercel.app/admin/dashboard-page`
- [ ] **IMMEDIATELY change default password**

### 3. Test PWA Features
- [ ] Install app on mobile device
- [ ] Test offline functionality
- [ ] Check push notification setup

## 🔐 Security Checklist

### Immediate Actions:
- [ ] Change default admin password
- [ ] Verify all environment variables are set
- [ ] Test HTTPS is working
- [ ] Verify CORS is properly configured

### Production Hardening:
- [ ] Set up monitoring (Vercel Analytics)
- [ ] Configure custom domain (optional)
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Review and update rate limiting settings

## 📱 Custom Domain Setup (Optional)

### 1. In Vercel Dashboard:
1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### 2. Update Environment Variables:
```bash
ALLOWED_ORIGINS=https://your-custom-domain.com,https://your-app.vercel.app
```

### 3. Update PWA Manifest:
Update `start_url` and `scope` in `/frontend/static/manifest.json`

## 🎯 Success Verification

Your SlugStop deployment is successful when:

- [ ] ✅ App loads at your Vercel URL
- [ ] ✅ Admin can login and access dashboard
- [ ] ✅ Bus tracking page displays METRO routes
- [ ] ✅ Trip planner shows route options
- [ ] ✅ PWA can be installed on mobile devices
- [ ] ✅ Database queries work (routes, stops display)
- [ ] ✅ No console errors in browser
- [ ] ✅ HTTPS certificate is active

## 🆘 Troubleshooting

### Common Issues:

**Database Connection Failed**
```bash
# Check if MONGODB_URI is correctly set
vercel env ls
```

**Authentication Not Working**
- Verify JWT_SECRET environment variable
- Check admin accounts exist in database

**CORS Errors**
- Update ALLOWED_ORIGINS with your actual domain
- Verify HTTPS is working

**Function Timeout**
- Optimize database queries
- Check MongoDB Atlas connection

### Debug Commands:
```bash
# Check deployment logs
vercel logs

# List environment variables
vercel env ls

# Check domain status
vercel domains ls
```

## 🎉 You're Live!

**Congratulations! SlugStop is now live on Vercel! 🚌✨**

Your users can now:
- 📱 Install SlugStop as a PWA
- 🗺️ Track Santa Cruz METRO buses in real-time
- 🧭 Plan trips across the transit system
- 📍 Get personalized route recommendations

**Share your app**: `https://your-app.vercel.app`

---

*Need help? Check the troubleshooting section or review the deployment logs in your Vercel dashboard.*
