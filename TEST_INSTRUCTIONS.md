# Test Your Email System

## ✅ Quick Test - Visit Your Render URL

**Your Render URL should look like:**
```
https://studymate-email-scheduler-XXXX.onrender.com
```

### Step 1: Find Your Render URL

1. Go to https://dashboard.render.com/
2. Click on your "studymate-email-scheduler" service
3. Copy the URL at the top (it will end in `.onrender.com`)

### Step 2: Trigger Email Manually

Visit this URL in your browser:
```
https://YOUR-RENDER-URL.onrender.com/send
```

For example:
```
https://studymate-email-scheduler-abcd.onrender.com/send
```

### Step 3: Check Response

**If you see:**
```json
{"success":true,"sent":1,"failed":0,"timestamp":"2025-12-20T..."}
```
✅ **Email sent successfully!** Check your inbox at `bestballersindfw@gmail.com`

**If you see:**
```json
{"success":true,"sent":0,"failed":0,"timestamp":"2025-12-20T..."}
```
❌ **Problem:** Email schedule not found or disabled

**If you see an error:**
Share it with me and I'll help fix it.

---

## 📧 Where to Check for Email

1. **Inbox:** bestballersindfw@gmail.com
2. **Spam/Junk folder** - Sometimes emails go there first
3. **Promotions tab** (if using Gmail)
4. **Wait 1-2 minutes** - SendGrid can take a moment

---

## 🔍 Alternative: Check Render Logs

1. Go to https://dashboard.render.com/
2. Click on your service
3. Click "Logs" tab
4. Look for:
   - `🚀 Starting daily email send...`
   - `📧 Sending email to bestballersindfw@gmail.com...`
   - `✅ Email sent successfully`

---

## 📅 About Your Cron Job

**Your current settings:**
- **Email:** bestballersindfw@gmail.com
- **Name:** Debaditya Dey
- **Preferred Time:** 15:00 (3:00 PM)
- **Last Email:** December 18, 2025
- **Next Scheduled:** December 20, 2025 at 3:00 PM

**Important:** Your cron job is set for **6:00 AM**, but your preferred time is **3:00 PM**. The system sends emails whenever triggered (it doesn't check preferred time yet).

### Options:

**Option A: Change Cron Job to 3 PM**
- Log into cron-job.org
- Edit your job
- Change time from 6:00 AM to 3:00 PM (15:00)

**Option B: Change Preferred Time to 6 AM**
- Open your Flutter app
- Go to Email Preferences
- Change time to 6:00 AM
- Save

---

## 🚨 If Email Doesn't Arrive

1. **Check SendGrid Dashboard:**
   - Go to https://app.sendgrid.com/activity
   - Look for emails sent today
   - Check delivery status

2. **Verify Render is Running:**
   - Dashboard should show "Live" status
   - Check logs for errors

3. **Run Manual Test Again:**
   - Visit the /send URL again
   - Check if response changes

---

## ❓ Need Help?

Share with me:
1. Your Render URL
2. The response you got from /send
3. Any errors from Render logs
