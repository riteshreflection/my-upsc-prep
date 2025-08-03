# Deployment Guide - UPSC Prep Portal

## 🚀 Quick Deploy to Vercel

### Step 1: Prepare Your Repository

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - UPSC Prep Portal"
   ```

2. **Create GitHub Repository**:
   - Go to [GitHub](https://github.com)
   - Click "New repository"
   - Name it `my-upsc-prep`
   - Make it public or private
   - Don't initialize with README (we already have one)

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/my-upsc-prep.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. **Go to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Project**:
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose your `my-upsc-prep` repository
   - Vercel will auto-detect Next.js settings

3. **Configure Project**:
   - **Project Name**: `upsc-prep-portal` (or your preferred name)
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Environment Variables** (if needed):
   - Currently, no environment variables are required
   - Firebase config is already in the code

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)
   - Your app will be live at `https://your-project-name.vercel.app`

### Step 3: Custom Domain (Optional)

1. **Add Custom Domain**:
   - In Vercel dashboard, go to your project
   - Click "Settings" → "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions

### Step 4: Continuous Deployment

- Every push to `main` branch will automatically trigger a new deployment
- Preview deployments are created for pull requests

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check if all dependencies are in `package.json`
   - Ensure Node.js version is 18+
   - Check build logs in Vercel dashboard

2. **Firebase Issues**:
   - Firebase config is already set up
   - No additional environment variables needed

3. **Performance Issues**:
   - Images are optimized automatically
   - Static assets are cached
   - API routes have 30s timeout

## 📊 Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Function Logs**: Check API route performance
- **Real-time Metrics**: Monitor user experience

## 🔄 Updates

To update your deployed app:

```bash
git add .
git commit -m "Update: [describe changes]"
git push origin main
```

Vercel will automatically deploy the new version.

---

🎉 **Your UPSC Prep Portal is now live!** 