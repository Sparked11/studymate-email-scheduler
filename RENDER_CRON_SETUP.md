# 🚀 Render Cron Jobs Setup Guide

## Why Render Cron Jobs?

✅ **100% FREE** - No credit card required
✅ **Built-in** - No external service needed
✅ **Reliable** - Runs on Render's infrastructure
✅ **Simple** - Just commit and push
✅ **Logs** - View execution logs in Render dashboard

---

## 📋 Setup Instructions

### Step 1: Your Configuration is Ready! ✅

The `render.yaml` file is already configured with:
- **Web Service**: Keeps your server running for manual triggers
- **Cron Job**: Automatically runs every hour at minute 0

```yaml
schedule: "0 * * * *"  # Runs at 0:00, 1:00, 2:00, etc.
```

### Step 2: Commit and Push Changes

```bash
cd email-scheduler
git add render.yaml
git commit -m "feat: add Render cron job configuration"
git push origin main
```

### Step 3: Deploy to Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Navigate to your service**: `studymate-email-scheduler`
3. Click **"Manual Deploy"** → **"Clear build cache & deploy"**

Render will automatically detect the `render.yaml` and create the cron job!

### Step 4: Verify Cron Job Creation

After deployment:
1. In Render dashboard, you should see **TWO services**:
   - `studymate-email-scheduler` (Web Service)
   - `studymate-email-cron` (Cron Job)
2. Click on the cron job to view:
   - Schedule: `0 * * * *`
   - Status: Active
   - Last run time
   - Execution logs

---

## 🔍 How It Works

### Automatic Execution
```
Every hour at minute 0:
├─ Render triggers the cron job
├─ Runs: sendDailyEmails(true)
├─ Checks all users' preferred times
├─ Sends emails to users whose time matches
└─ Exits cleanly
```

### Example Timeline (UTC)
```
00:00 → Cron runs → Sends to users with 00:00 preference
01:00 → Cron runs → Sends to users with 01:00 preference
02:00 → Cron runs → Sends to users with 02:00 preference
...
23:00 → Cron runs → Sends to users with 23:00 preference
```

---

## 📊 Monitoring

### View Logs
1. Go to Render dashboard
2. Click on `studymate-email-cron`
3. Click **"Logs"** tab
4. See execution results for each run

### Check Status
```bash
# Manual test (triggers immediately)
curl https://studymate-email-scheduler.onrender.com/send

# Expected response:
{
  "success": true,
  "sent": 2,
  "failed": 0,
  "skipped": 5,
  "timestamp": "2025-12-21T15:00:00.000Z"
}
```

---

## ⚙️ Customization

### Change Schedule

Edit `render.yaml` and change the schedule:

```yaml
# Every 30 minutes
schedule: "*/30 * * * *"

# Every 2 hours
schedule: "0 */2 * * *"

# Twice a day (9 AM and 6 PM UTC)
schedule: "0 9,18 * * *"

# Once a day at midnight UTC
schedule: "0 0 * * *"
```

Then commit and push to apply changes.

### Cron Format Reference
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *
```

---

## 🐛 Troubleshooting

### Cron Job Not Running?

1. **Check Render Dashboard**:
   - Is the cron job service "Active"?
   - Are there any error logs?

2. **Verify Environment Variables**:
   - Go to cron job settings
   - Ensure all env vars are set:
     - `FIREBASE_PROJECT_ID`
     - `SENDGRID_API_KEY`
     - `FIREBASE_SERVICE_ACCOUNT`

3. **Test Manually**:
   ```bash
   curl https://studymate-email-scheduler.onrender.com/send
   ```

### No Emails Sent?

Check the logs for:
- `"⏰ Skipping ... - not scheduled for this hour"`
  → Normal! Emails only send at user's preferred time
- `"❌ Failed to send email"`
  → SendGrid API key issue
- `"📭 No email schedules found"`
  → No users have signed up yet

---

## 🎯 Advantages Over cron-job.org

| Feature | Render Cron | cron-job.org |
|---------|-------------|--------------|
| Cost | 100% FREE | FREE |
| Setup | Git commit | Web dashboard |
| Logs | Built-in | External |
| Output Limits | None | ~500KB |
| Reliability | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Maintenance | Zero | Manual updates |

---

## ✅ Next Steps

1. ✅ Configuration ready (`render.yaml`)
2. 📤 Commit and push to GitHub
3. 🚀 Deploy on Render
4. 👀 Monitor first execution
5. 🎉 Emails send automatically!

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs/cronjobs
- **Check Logs**: Render Dashboard → studymate-email-cron → Logs
- **Test Endpoint**: `curl https://studymate-email-scheduler.onrender.com/send`

**You're all set!** 🚀 Just commit, push, and deploy!
