# Email Not Received - Troubleshooting Checklist

## Step 1: Check Cron Job Execution
1. Go to [cron-job.org](https://cron-job.org)
2. Login to your account
3. Find your job: "StudyMate Daily Emails"
4. Click on it to view details
5. Check "Execution History"

**What to look for:**
- Was there an execution at 6 AM today?
- Status: Success (200) or Failed?
- Response time: Should be 2-10 seconds

**Possible issues:**
- ❌ No execution = Cron job is disabled or time is wrong
- ❌ Failed status = Render service had an error
- ❌ Wrong timezone = Job ran at 6 AM in different timezone

## Step 2: Check Your Timezone
**Important:** Cron-job.org uses the timezone YOU selected when creating the job.

Example:
- If you selected "America/New_York" → Runs at 6 AM Eastern Time
- If you selected "Asia/Kolkata" → Runs at 6 AM Indian Time
- If you selected "UTC" → Runs at 6 AM UTC (might be different from your local time)

**Action:** 
1. Go to cron-job.org
2. Edit your job
3. Check what timezone is selected
4. Change it to YOUR timezone if needed

## Step 3: Check if You're in Firestore
Your email preferences must be saved in Firestore for the scheduler to find you.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select: studymateaikeystorage
3. Click: Firestore Database
4. Look for collection: `email_schedules`
5. Find your user document (your user ID)

**Required fields in your document:**
- `emailEnabled`: true (boolean)
- `email`: your-email@gmail.com (string)
- `userName`: Your Name (string)
- `interestedTopics`: [...] (array)

**Common issues:**
- ❌ Collection doesn't exist = You haven't saved preferences in the app yet
- ❌ emailEnabled is false = Emails are disabled
- ❌ Wrong email address = Email sent to wrong address
- ❌ Document doesn't exist = Preferences not saved

## Step 4: Test Manually Right Now

Open your browser and visit:
```
https://your-render-url.onrender.com/send
```

**What you should see:**
```json
{"success":true,"sent":1,"failed":0}
```

**If you see "sent":0:**
- No users in Firestore with emailEnabled=true
- Go save your preferences in the Flutter app

**If you see "sent":1:**
- Email was sent! Check inbox and spam folder

## Step 5: Check Render Logs

1. Go to [render.com](https://render.com)
2. Click on your service: studymate-email-scheduler
3. Click "Logs" tab
4. Look for entries around 6 AM

**What to look for:**
```
🚀 Starting daily email send...
⏰ Time: 2025-12-19T11:00:00.000Z  (if 6 AM in UTC+5 timezone)
✅ Email sent to your-email@gmail.com
📊 Summary:
✅ Sent: 1
```

**Common log messages:**
- `📭 No email schedules found` = No users in Firestore
- `⏭️ Skipping ... - emails disabled` = emailEnabled is false
- `❌ Failed to send email` = SendGrid error

## Step 6: Check SendGrid Activity

1. Go to [SendGrid Dashboard](https://app.sendgrid.com/activity)
2. Look for emails sent today
3. Filter by your email address

**Statuses:**
- ✅ Delivered = Email sent successfully
- ⏳ Processed = On the way
- ❌ Bounced = Email rejected
- ❌ Dropped = Invalid email or spam

## Step 7: Verify Render Service is Awake

Render free tier sleeps after 15 minutes of inactivity.

**Test:**
Visit: `https://your-render-url.onrender.com/health`

**Expected:**
```json
{"status":"ok","service":"StudyMate.AI Email Scheduler","timestamp":"..."}
```

**If it takes 30+ seconds to respond:**
- Service was asleep (normal)
- Cron job should wake it up automatically
- First request after sleep is slow

---

## 🎯 Quick Diagnosis:

### Scenario A: Cron job didn't run
**Fix:** Check timezone, enable the job, or manually trigger it

### Scenario B: Cron job ran but you're not in Firestore
**Fix:** Open your Flutter app, go to Email Preferences, save settings

### Scenario C: Email sent but not received
**Fix:** Check spam folder, check SendGrid activity

### Scenario D: Render service is down
**Fix:** Check Render dashboard, redeploy if needed

---

## 🚀 Manual Test RIGHT NOW

Run these commands to test immediately:

1. **Save preferences in your Flutter app:**
   - Open app → Email Preferences
   - Enable emails → Save

2. **Trigger email manually:**
   - Visit: https://your-render-url.onrender.com/send

3. **Check your inbox** (and spam folder!)

---

## 📝 What to Share

To help you debug, please check and share:

1. ✅ Cron job execution history - did it run? What status?
2. ✅ Timezone selected in cron-job.org
3. ✅ Do you have a document in Firestore `email_schedules` collection?
4. ✅ What does /send endpoint return when you visit it?
5. ✅ Any errors in Render logs?

Share these details and I can pinpoint the exact issue!
