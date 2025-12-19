# Deploy to Render.com Without GitHub

## Method 1: Docker Deployment (Recommended)

### Step 1: Install Docker Desktop
1. Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Install and start Docker Desktop
3. Verify installation:
   ```bash
   docker --version
   ```

### Step 2: Build Docker Image Locally
```bash
cd email-scheduler
docker build -t studymate-email-scheduler .
```

### Step 3: Test Locally (Optional)
```bash
docker run -e FIREBASE_PROJECT_ID=studymateaikeystorage \
  -e SENDGRID_API_KEY=your_key_here \
  -e FIREBASE_SERVICE_ACCOUNT='{"type":"service_account"...}' \
  studymate-email-scheduler
```

### Step 4: Push to Docker Hub
1. Create free account at [hub.docker.com](https://hub.docker.com)
2. Create repository: `studymate-email-scheduler`
3. Login and push:
   ```bash
   docker login
   docker tag studymate-email-scheduler YOUR_USERNAME/studymate-email-scheduler
   docker push YOUR_USERNAME/studymate-email-scheduler
   ```

### Step 5: Deploy to Render
1. Go to [render.com](https://render.com) → Sign up
2. Click **New +** → **Web Service**
3. Select **Deploy an existing image from a registry**
4. Enter: `YOUR_USERNAME/studymate-email-scheduler`
5. Configure:
   - **Name**: studymate-email-scheduler
   - **Instance Type**: Free
   - **Environment Variables**: Add all 3 variables
6. Click **Create Web Service**

---

## Method 2: Direct Upload (No Docker, No Git)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with email (no GitHub needed)

### Step 2: Deploy from Render Dashboard
1. Click **New +** → **Web Service**
2. Click **Public Git repository**
3. BUT instead, use **Manual deployment**:
   - Render doesn't support direct folder upload for free tier
   - You'll need to use Docker method above OR Railway.app below

---

## Method 3: Railway.app (Easiest - No Docker)

Railway supports direct folder deployment without Docker!

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway
```bash
railway login
```
This opens browser to authenticate.

### Step 3: Initialize Project
```bash
cd email-scheduler
railway init
```
Select "Create new project" → Name it "studymate-email-scheduler"

### Step 4: Add Environment Variables
```bash
railway variables set FIREBASE_PROJECT_ID=studymateaikeystorage
railway variables set SENDGRID_API_KEY=SG.K79U9u1-RbuvWIzz0BbIWw...
railway variables set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account"...}'
```

### Step 5: Deploy
```bash
railway up
```

That's it! Railway will:
- Detect Node.js project
- Install dependencies
- Deploy your app
- Give you a URL

### Step 6: Get Your URL
```bash
railway domain
```

Railway free tier includes:
- $5 free credit
- 500 hours execution time
- Perfect for this use case

---

## Method 4: Heroku (Classic Option)

### Step 1: Install Heroku CLI
```bash
brew tap heroku/brew && brew install heroku
```

### Step 2: Login
```bash
heroku login
```

### Step 3: Create App
```bash
cd email-scheduler
heroku create studymate-email-scheduler
```

### Step 4: Set Environment Variables
```bash
heroku config:set FIREBASE_PROJECT_ID=studymateaikeystorage
heroku config:set SENDGRID_API_KEY=SG.K79U9u1-RbuvWIzz0BbIWw...
heroku config:set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account"...}'
```

### Step 5: Deploy
```bash
# Initialize git if not already
git init
git add .
git commit -m "Initial commit"

# Deploy to Heroku
git push heroku main
```

---

## Recommendation

**For simplest setup: Use Railway.app (Method 3)**
- No Docker needed
- No GitHub needed
- Just install CLI, login, and deploy
- 3 commands total
- Free $5 credit

**For most reliable: Use Docker + Render (Method 1)**
- Industry standard
- Better for scaling later
- Free forever

---

## After Deployment: Set Up Cron Job

Once deployed with any method above, you'll get a URL like:
- Railway: `https://studymate-email-scheduler.up.railway.app`
- Render: `https://studymate-email-scheduler.onrender.com`
- Heroku: `https://studymate-email-scheduler.herokuapp.com`

Then set up daily execution:

1. Go to [cron-job.org](https://cron-job.org)
2. Create account → Add new cronjob
3. Enter your deployment URL
4. Set schedule: `0 9 * * *` (9 AM daily)
5. Enable and test

Done! Your emails will send daily automatically.

---

## Which Method Should You Choose?

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| Railway | Easiest, no Docker | $5/month after credit | Quick start |
| Render + Docker | Free forever | Requires Docker | Long-term |
| Heroku | Classic, well-documented | Requires git | Familiar with Heroku |

**My Recommendation: Start with Railway (Method 3) - literally 5 minutes to deploy!**
