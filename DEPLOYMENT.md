# StudyMate.AI Email Scheduler - Production Deployment

## Overview
This is a standalone Node.js script that sends daily personalized emails to StudyMate.AI users. It runs independently of Firebase Cloud Functions, making it completely free to operate.

## Prerequisites
- Firebase project with Firestore database
- SendGrid API key (100 emails/day free tier)
- Free hosting account (Render, Railway, or Heroku)

## Setup Instructions

### Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **studymateaikeystorage**
3. Click the gear icon → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file (keep it secure!)

### Step 2: Deploy to Render.com (Recommended - Free Forever)

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub (free)

2. **Create New Web Service**
   - Click **New +** → **Web Service**
   - Choose **Deploy an existing image from a registry** OR **Build from Git**
   - For Git: Connect this repository or upload to GitHub first

3. **Configuration**
   - **Name**: studymate-email-scheduler
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

4. **Environment Variables**
   Add these in Render's environment variables section:
   
   - `FIREBASE_PROJECT_ID` = `studymateaikeystorage`
   - `SENDGRID_API_KEY` = `SG.K79U9u1-RbuvWIzz0BbIWw...` (your full key)
   - `FIREBASE_SERVICE_ACCOUNT` = Paste the ENTIRE contents of your service account JSON file
     - Open the JSON file you downloaded
     - Copy everything (all the JSON)
     - Paste it as the value

5. **Deploy**
   - Click **Create Web Service**
   - Render will deploy your app and give you a URL like: `https://studymate-email-scheduler.onrender.com`

### Step 3: Set Up Daily Scheduling (Free Cron Job)

Since Render free tier sleeps after inactivity, use a free cron service to wake it up daily:

1. **Go to [cron-job.org](https://cron-job.org)**
   - Create free account
   - Go to **Cronjobs** → **Create cronjob**

2. **Configure Daily Email Job**
   - **Title**: StudyMate Daily Emails
   - **URL**: `https://studymate-email-scheduler.onrender.com` (your Render URL)
   - **Schedule**: 
     - For 9:00 AM daily: `0 9 * * *`
     - For 7:00 PM daily: `0 19 * * *`
   - **Time Zone**: Select your timezone
   - **Enabled**: Yes

3. **Save and Test**
   - Click **Create**
   - Click **Execute now** to test
   - Check SendGrid dashboard to confirm emails were sent

### Alternative: Railway.app

1. Go to [railway.app](https://railway.app)
2. Sign up (free $5 credit, then $5/month)
3. Click **New Project** → **Deploy from GitHub repo**
4. Add environment variables (same as above)
5. Railway automatically handles scheduling with cron syntax

### Alternative: Heroku

1. Go to [heroku.com](https://heroku.com)
2. Create new app
3. Deploy via Git or GitHub
4. Add environment variables in Settings → Config Vars
5. Use **Heroku Scheduler** add-on (free) for daily execution

## Environment Variables Reference

```bash
FIREBASE_PROJECT_ID=studymateaikeystorage
SENDGRID_API_KEY=SG.K79U9u1-RbuvWIzz0BbIWw...
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"studymateaikeystorage"...}
```

## Testing

### Test Locally First

1. Create `.env` file in `email-scheduler/` folder:
   ```bash
   FIREBASE_PROJECT_ID=studymateaikeystorage
   SENDGRID_API_KEY=SG.K79U9u1-RbuvWIzz0BbIWw...
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account"...}
   ```

2. Install dependencies:
   ```bash
   cd email-scheduler
   npm install
   ```

3. Run manually:
   ```bash
   npm start
   ```

4. Check console output for success/errors

### Production Testing

1. Trigger the cron job manually
2. Check Render logs: Dashboard → Logs
3. Verify in SendGrid: Dashboard → Activity
4. Check your email inbox for test emails

## How It Works

1. **Scheduled Trigger**: Cron-job.org hits your Render URL daily
2. **Wake Up**: Render app wakes from sleep, starts script
3. **Fetch Users**: Script queries Firestore `email_schedules` collection for users with `emailEnabled: true`
4. **Calculate Stats**: For each user, fetches their study sessions and calculates:
   - Questions answered
   - Flashcards reviewed
   - Lectures recorded
   - Current streak
5. **Determine Activity**: Checks if user was active today
6. **Generate Email**: Creates personalized HTML email:
   - **Active users**: Get insights about their stats
   - **Inactive users**: Get "We miss you!" comeback email
7. **Send via SendGrid**: Delivers emails and logs results

## Monitoring

- **Render Logs**: View execution logs in Render dashboard
- **SendGrid Activity**: Check delivery status at [SendGrid Dashboard](https://app.sendgrid.com/activity)
- **Cron-job.org History**: View execution history in cron-job.org dashboard
- **Email yourself**: Add your own email to test

## Troubleshooting

### Emails not sending
- Check Render logs for errors
- Verify environment variables are set correctly
- Confirm SendGrid API key is valid
- Check SendGrid account status (may need to verify)

### Script timing out
- Render free tier has 15-minute timeout (should be enough)
- If needed, batch process users (send to 50 at a time)

### Users not receiving emails
- Check if `emailEnabled` is `true` in their `email_schedules` document
- Verify their email address is correct
- Check SendGrid activity for delivery status
- Emails may go to spam initially (users need to mark "Not Spam")

### Cron job not triggering
- Verify cron-job.org job is enabled
- Check execution history
- Confirm URL is correct
- Test manual execution first

## Cost Breakdown

- **Render.com**: $0 (free tier includes 750 hours/month)
- **SendGrid**: $0 (free 100 emails/day - 3,000/month)
- **Cron-job.org**: $0 (free tier includes unlimited jobs)
- **Firebase Firestore**: $0 (Spark plan includes 50K reads/day)

**Total Monthly Cost: $0**

## Scaling

If you grow beyond free tiers:
- **SendGrid**: $19.95/month for 40,000 emails
- **Render**: $7/month for always-on service
- **Firebase**: Blaze plan (pay-as-you-go, very cheap for small apps)

## Next Steps

1. Follow Step 1 to get Firebase service account
2. Follow Step 2 to deploy to Render
3. Follow Step 3 to set up daily scheduling
4. Test with your own email first
5. Monitor for a few days to ensure reliability
6. Adjust timing or templates as needed

## Support

If you encounter issues:
1. Check Render logs first
2. Review SendGrid activity feed
3. Verify all environment variables
4. Test locally before debugging production
