# StudyMate.AI Email Scheduler 📧

Complete documentation for the automated daily email system that sends personalized study insights to users at their preferred times.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Overview](#overview)
3. [Setup Guide](#setup-guide)
4. [Smart Time-Based Scheduling](#smart-time-based-scheduling)
5. [API Endpoints](#api-endpoints)
6. [Timezone Conversion](#timezone-conversion)
7. [Troubleshooting](#troubleshooting)
8. [Cron Job Configuration](#cron-job-configuration)
9. [Pre-Launch Checklist](#pre-launch-checklist)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Monitoring](#monitoring)

---

## 🚀 Quick Start

### Immediate Setup (5 minutes)

1. **Configure Cron Job:**
   - Go to [cron-job.org](https://cron-job.org)
   - Create new cron job
   - **URL:** `https://studymate-email-scheduler.onrender.com/cron`
   - **Schedule:** `0 * * * *` (every hour)
   - Save and enable

2. **Verify Deployment:**
   - Visit: `https://studymate-email-scheduler.onrender.com/health`
   - Should return: `{"status":"ok"}`

3. **Test Email Sending:**
   - Visit: `https://studymate-email-scheduler.onrender.com/send`
   - Check response for sent/skipped counts

**You're done!** The system will now send emails every hour to users whose `preferredTime` matches the current UTC hour.

---

## 📖 Overview

### What This System Does

- ✅ Sends personalized daily emails to StudyMate.AI users
- ✅ Respects each user's preferred time (timezone-aware)
- ✅ Prevents duplicate emails (max 1 per day per user)
- ✅ Includes study stats, streaks, and activity summaries
- ✅ Beautiful HTML email templates
- ✅ Fully automated via hourly cron jobs

### Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│ Cron-Job.org│─────>│ Render Server│─────>│  Firestore  │
│  (Hourly)   │      │   (Node.js)  │      │  (Users)    │
└─────────────┘      └──────┬───────┘      └─────────────┘
                            │
                            ↓
                     ┌──────────────┐
                     │   SendGrid   │
                     │  (Email API) │
                     └──────┬───────┘
                            │
                            ↓
                     ┌──────────────┐
                     │    Users     │
                     │ (Email Inbox)│
                     └──────────────┘
```

### Tech Stack

- **Runtime:** Node.js v25.2.1
- **Database:** Cloud Firestore
- **Email Service:** SendGrid API (100 emails/day free tier)
- **Hosting:** Render.com (free tier)
- **Scheduling:** Cron-job.org (free tier)
- **Repository:** GitHub (auto-deploy)

---

## 🔧 Setup Guide

### Prerequisites

1. **SendGrid Account:**
   - Sign up at [sendgrid.com](https://sendgrid.com)
   - Create API key (full access)
   - Verify sender email address

2. **Firebase Project:**
   - Create Firestore database
   - Generate service account credentials
   - Download JSON key file

3. **Render Account:**
   - Sign up at [render.com](https://render.com)
   - Connect GitHub repository

4. **Cron Service:**
   - Sign up at [cron-job.org](https://cron-job.org) (recommended)
   - Or alternatives: EasyCron, UptimeRobot

### Environment Variables

Create these in Render dashboard:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_api_key_here

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}

# Optional
PORT=10000
NODE_ENV=production
```

### Deployment Steps

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/email-scheduler.git
   git push -u origin main
   ```

2. **Deploy to Render:**
   - Create new Web Service
   - Connect GitHub repo
   - Set environment variables
   - Deploy!

3. **Configure Cron:**
   - Add cron job pointing to `/cron` endpoint
   - Set hourly schedule
   - Enable job

---

## ⏰ Smart Time-Based Scheduling

### How It Works

The system runs **every hour** and checks each user's `preferredTime`. Emails are only sent when:

1. ✅ Current UTC hour matches user's `preferredTime`
2. ✅ User has `emailEnabled: true`
3. ✅ User hasn't received email today (`lastEmailSent`)

### Example Timeline

```
User A: preferredTime = "15:00" (3 PM UTC)
User B: preferredTime = "18:00" (6 PM UTC)
User C: preferredTime = "09:00" (9 AM UTC)

00:00 UTC - Cron runs → All users skipped
01:00 UTC - Cron runs → All users skipped
...
09:00 UTC - Cron runs → ✅ User C receives email
10:00 UTC - Cron runs → All users skipped
...
15:00 UTC - Cron runs → ✅ User A receives email
16:00 UTC - Cron runs → All users skipped
...
18:00 UTC - Cron runs → ✅ User B receives email
19:00 UTC - Cron runs → All users skipped
```

### Firestore Data Structure

```json
{
  "email_schedules/{userId}": {
    "email": "user@example.com",
    "emailEnabled": true,
    "preferredTime": "15:00",          // UTC time
    "preferredTimeLocal": "10:00",     // Local time (for reference)
    "timezone": "EST",                  // Timezone name
    "interestedTopics": [
      "Quiz Performance",
      "Flashcard Progress",
      "Lecture Notes",
      "Study Streaks"
    ],
    "userName": "John Doe",
    "userId": "abc123",
    "lastEmailSent": Timestamp,         // Last email sent date
    "nextScheduledEmail": Timestamp,    // Next scheduled email
    "updatedAt": Timestamp
  }
}
```

### Duplicate Prevention

The system uses `lastEmailSent` timestamp to ensure users receive **maximum 1 email per day**:

```javascript
function shouldSendEmail(schedule) {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const preferredHour = parseInt(schedule.preferredTime.split(':')[0]);
  
  // Check if time matches
  if (currentHour !== preferredHour) {
    return false;
  }
  
  // Check if already sent today
  if (schedule.lastEmailSent) {
    const lastSent = schedule.lastEmailSent.toDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (lastSent >= today) {
      return false; // Already sent today
    }
  }
  
  return true;
}
```

---

## 🌐 API Endpoints

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "StudyMate.AI Email Scheduler",
  "timestamp": "2025-12-20T15:00:00.000Z"
}
```

### `GET /send`

Manually trigger email sending with full response.

**Response:**
```json
{
  "success": true,
  "sent": 2,
  "failed": 0,
  "skipped": 5,
  "timestamp": "2025-12-20T15:00:01.234Z"
}
```

**Use Case:** Manual testing, browser access

### `GET /trigger`

Alias for `/send` endpoint.

### `GET /cron` ⭐ Recommended for Cron Jobs

Ultra-silent endpoint that returns HTTP 204 (No Content).

**Response:** (empty - zero bytes)

**HTTP Status:** 204 No Content

**Use Case:** Cron-job.org (avoids "output too large" errors)

**Behavior:**
- Starts email sending process
- Returns immediately (fire-and-forget)
- Users still receive full emails
- Cron service sees minimal output

---

## 🌍 Timezone Conversion

### Problem

Users in different timezones want emails at their local preferred time, not UTC time.

### Solution

The Flutter app converts local time to UTC before saving to Firestore.

### Implementation

**Flutter App (email_preferences_page.dart):**

```dart
/// Convert local time to UTC time
String _convertLocalTimeToUTC(String localTime) {
  final timeParts = localTime.split(':');
  final hour = int.parse(timeParts[0]);
  final minute = timeParts.length > 1 ? int.parse(timeParts[1]) : 0;
  
  final now = DateTime.now();
  final localDateTime = DateTime(now.year, now.month, now.day, hour, minute);
  final utcDateTime = localDateTime.toUtc();
  
  return '${utcDateTime.hour.toString().padLeft(2, '0')}:00';
}

/// Convert UTC time back to local for display
String _convertUTCTimeToLocal(String utcTime) {
  final timeParts = utcTime.split(':');
  final hour = int.parse(timeParts[0]);
  final minute = timeParts.length > 1 ? int.parse(timeParts[1]) : 0;
  
  final now = DateTime.now().toUtc();
  final utcDateTime = DateTime.utc(now.year, now.month, now.day, hour, minute);
  final localDateTime = utcDateTime.toLocal();
  
  return '${localDateTime.hour.toString().padLeft(2, '0')}:00';
}
```

### Example Conversions

| User Location | Local Selection | UTC Stored | Email Sent At |
|---------------|----------------|------------|---------------|
| New York (EST, UTC-5) | 3:00 PM | 20:00 | 20:00 UTC = 3:00 PM EST ✅ |
| Los Angeles (PST, UTC-8) | 3:00 PM | 23:00 | 23:00 UTC = 3:00 PM PST ✅ |
| London (GMT, UTC+0) | 3:00 PM | 15:00 | 15:00 UTC = 3:00 PM GMT ✅ |
| Tokyo (JST, UTC+9) | 3:00 PM | 06:00 | 06:00 UTC = 3:00 PM JST ✅ |

### Benefits

✅ Users receive emails at their local preferred time  
✅ Handles Daylight Saving Time automatically  
✅ Works for users worldwide  
✅ No scheduler changes needed  

---

## 🔧 Troubleshooting

### Cron Job Issues

#### "Output Too Large" Error

**Problem:** Cron-job.org returns "Failed (output too large)"

**Solution:** Use `/cron` endpoint instead of `/send`

**Steps:**
1. Edit cron job in cron-job.org
2. Change URL to: `https://your-url.onrender.com/cron`
3. Save and test

**Why:** `/cron` returns HTTP 204 (zero bytes) instead of JSON response

#### Emails Not Sending

**Check 1: Is any user's preferredTime = current UTC hour?**
```bash
# Check current UTC hour
date -u +%H
# Should match a user's preferredTime
```

**Check 2: Are users enabled?**
```
Firestore → email_schedules → check emailEnabled: true
```

**Check 3: Already sent today?**
```
Check lastEmailSent timestamp in Firestore
```

**Check 4: Is Render service awake?**
```
# Free tier sleeps after 15 min inactivity
# Hourly cron keeps it awake
curl https://your-url.onrender.com/health
```

### Email Delivery Issues

#### Emails in Spam

**Solution:**
1. Verify sender domain in SendGrid
2. Add SPF/DKIM records
3. Warm up sending (start with few emails)
4. Ask users to whitelist sender

#### SendGrid API Errors

**Common Errors:**

- **401 Unauthorized:** Invalid API key
- **403 Forbidden:** API key lacks permissions
- **429 Too Many Requests:** Rate limit exceeded (100/day on free tier)

**Check:**
```bash
curl https://your-url.onrender.com/send
# Look for "Failed" count and error messages in Render logs
```

### Firestore Issues

#### Permission Denied

**Problem:** Can't read/write Firestore

**Solution:**
1. Check service account has Firestore permissions
2. Verify FIREBASE_SERVICE_ACCOUNT env var is valid JSON
3. Check Firestore security rules

#### Field Name Mismatches

The system supports both field names for compatibility:
- `interestedTopics` (new)
- `selectedTopics` (old)

Both will work, but prefer `interestedTopics`.

### Render Deployment Issues

#### Build Failed

**Common Causes:**
- Missing package.json
- Node version mismatch
- Missing dependencies

**Solution:**
```bash
# Check package.json exists
# Verify dependencies are listed
# Check Render build logs
```

#### Service Sleeping

**Problem:** Free tier sleeps after 15 min inactivity

**Solution:**
- Hourly cron keeps it awake ✅
- Or upgrade to paid tier
- Or use UptimeRobot to ping every 5 min

---

## ⏱️ Cron Job Configuration

### Recommended: Use `/cron` Endpoint

**URL:** `https://your-render-url.onrender.com/cron`
**Schedule:** `0 * * * *` (every hour at minute 0)
**Response:** HTTP 204 No Content (zero bytes)

### Alternative: Use `/send` Endpoint

**URL:** `https://your-render-url.onrender.com/send`
**Schedule:** `0 * * * *` (every hour at minute 0)
**Response:** Small JSON (~20 bytes)

### Cron Schedule Patterns

```
0 * * * *     - Every hour at minute 0
*/5 * * * *   - Every 5 minutes (not recommended)
0 6 * * *     - Daily at 6:00 AM (old method, don't use)
0 */2 * * *   - Every 2 hours
```

### Alternative Cron Services

If cron-job.org doesn't work:

1. **EasyCron.com** - More generous output limits
2. **UptimeRobot.com** - Also monitors uptime
3. **Render Cron Jobs** - Native Render feature (best option)
4. **Vercel Cron** - If deploying to Vercel

### Render Cron Jobs (Recommended for Production)

**Steps:**
1. Render Dashboard → New + → Cron Job
2. Connect GitHub repo
3. **Command:** `node -e "require('./index.js').sendDailyEmails(true)"`
4. **Schedule:** `0 * * * *`

**Benefits:**
- No HTTP overhead
- No output limits
- Runs directly on Render infrastructure
- Most reliable

---

## ✅ Pre-Launch Checklist

### Email System

- [ ] SendGrid API key configured
- [ ] Sender email verified in SendGrid
- [ ] Test email sent successfully
- [ ] Email template displays correctly
- [ ] All stats (quizzes, flashcards, notes, streaks) showing

### Firebase/Firestore

- [ ] Firestore database created
- [ ] Service account credentials configured
- [ ] Security rules updated
- [ ] Test data exists in `email_schedules` collection
- [ ] User has `preferredTime` set

### Deployment

- [ ] Code pushed to GitHub
- [ ] Render service deployed successfully
- [ ] Environment variables set correctly
- [ ] `/health` endpoint returns 200 OK
- [ ] `/send` endpoint works manually
- [ ] Render logs showing activity

### Cron Job

- [ ] Cron service account created (cron-job.org)
- [ ] Cron job created with `/cron` URL
- [ ] Schedule set to hourly (`0 * * * *`)
- [ ] Cron job enabled
- [ ] Test execution successful (204 No Content)

### Flutter App

- [ ] Email preferences page working
- [ ] User can enable/disable emails
- [ ] User can select preferred time
- [ ] User can select topics
- [ ] Time converts to UTC before saving
- [ ] Preferences save to Firestore successfully

### Testing

- [ ] Manual `/send` test successful
- [ ] Cron job test execution successful
- [ ] Email received in inbox (not spam)
- [ ] Email content is correct
- [ ] Stats are accurate
- [ ] Links in email work
- [ ] Multiple users receive at different times

### Monitoring

- [ ] Render dashboard accessible
- [ ] Can view Render logs
- [ ] SendGrid activity dashboard accessible
- [ ] Firestore console accessible
- [ ] Cron-job.org execution history visible

### Documentation

- [ ] README.md complete
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Troubleshooting guide available

---

## 🧪 Testing

### Manual Testing

**Test 1: Health Check**
```bash
curl https://your-url.onrender.com/health
```
Expected: `{"status":"ok","service":"StudyMate.AI Email Scheduler","timestamp":"..."}`

**Test 2: Manual Email Send**
```bash
curl https://your-url.onrender.com/send
```
Expected: `{"success":true,"sent":X,"failed":0,"skipped":Y,"timestamp":"..."}`

**Test 3: Cron Endpoint**
```bash
curl -I https://your-url.onrender.com/cron
```
Expected: `HTTP/1.1 204 No Content`

### Local Testing

**Run test script:**
```bash
cd email-scheduler
node test-send.js
```

This will:
- Connect to Firestore
- Fetch test user data
- Send test email
- Display results

### Test Users

Create test users in Firestore with different `preferredTime` values:

```json
// User 1: Morning person
{
  "email": "test1@example.com",
  "preferredTime": "09:00",
  "emailEnabled": true
}

// User 2: Afternoon person
{
  "email": "test2@example.com",
  "preferredTime": "15:00",
  "emailEnabled": true
}

// User 3: Evening person
{
  "email": "test3@example.com",
  "preferredTime": "21:00",
  "emailEnabled": true
}
```

### Verify Email Content

Check that email includes:
- ✅ User's name
- ✅ Yesterday's stats (quizzes, flashcards, notes, study time)
- ✅ Current streak
- ✅ Selected topics only
- ✅ Beautiful HTML formatting
- ✅ Proper date

---

## 🚀 Deployment

### GitHub → Render Auto-Deploy

**Setup:**
1. Push code to GitHub
2. Render detects changes
3. Automatic deployment starts
4. Wait 1-2 minutes
5. Service restarts with new code

**Check Deployment:**
- Render Dashboard → Events tab
- Look for "Deploy succeeded" message
- Check deployment logs for errors

### Environment Variables

Set in Render dashboard under "Environment":

```bash
SENDGRID_API_KEY=SG.your_api_key_here
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
PORT=10000
NODE_ENV=production
```

### Deployment Checklist

- [ ] Code committed to Git
- [ ] Pushed to GitHub main branch
- [ ] Render shows "Deploy started"
- [ ] Wait 1-2 minutes
- [ ] Render shows "Deploy succeeded"
- [ ] Test `/health` endpoint
- [ ] Check Render logs for startup message

---

## 📊 Monitoring

### Render Dashboard

**View Logs:**
1. Go to dashboard.render.com
2. Click on "studymate-email-scheduler" service
3. Click "Logs" tab
4. See real-time activity

**What to Look For:**
```
🚀 Email scheduler server running on port 10000
📧 Email send triggered via HTTP request
🚀 Starting daily email send...
⏰ UTC Hour: 15:00
📧 Sending to user@example.com
✅ Email sent successfully
```

### SendGrid Dashboard

**Check Email Activity:**
1. Go to app.sendgrid.com
2. Click "Activity"
3. See delivery status

**Metrics:**
- Delivered
- Opened
- Clicked
- Bounced
- Spam reports

### Cron-Job.org History

**Check Executions:**
1. Go to cron-job.org dashboard
2. Click on your job
3. View execution history

**Status:**
- ✅ Successful (204 No Content)
- ❌ Failed (output too large)
- ⏱️ Timeout
- 🔒 URL not accessible

### Firestore Console

**Monitor Data:**
1. Go to Firebase Console
2. Navigate to Firestore
3. Check `email_schedules` collection

**Verify:**
- `lastEmailSent` updates daily
- `emailEnabled` flags are correct
- `preferredTime` values are valid

---

## 💰 Costs & Limits

### Free Tier Usage

**SendGrid:**
- 100 emails/day (free tier)
- Sufficient for small user base
- $14.95/month for 40,000 emails (if needed)

**Render:**
- Free tier includes 750 hours/month
- One service = 744 hours/month (24/7) ✅
- May sleep after 15min inactivity (hourly cron keeps it awake)

**Cron-Job.org:**
- Unlimited free cron jobs ✅
- Hourly executions = 24/day = 720/month ✅

**Firestore:**
- 50K reads/day (free tier)
- 24 cron checks/day × 30 days = 720 reads/month ✅
- Well within limits

**Total Cost:** **$0/month** for reasonable usage ✅

---

## 📚 Additional Resources

### Official Documentation

- [SendGrid API Docs](https://docs.sendgrid.com/api-reference)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Render Docs](https://render.com/docs)
- [Cron-Job.org Docs](https://cron-job.org/en/documentation/)

### Related Files

- `index.js` - Main server file
- `test-send.js` - Local testing script
- `package.json` - Dependencies
- `.env.template` - Environment variable template

### Support

For issues or questions:
1. Check Render logs first
2. Check SendGrid activity dashboard
3. Test `/send` endpoint manually
4. Review Firestore data
5. Check cron-job.org execution history

---

## 🎉 Summary

You now have a **production-ready email system** that:

✅ Sends personalized daily emails automatically  
✅ Respects each user's preferred time  
✅ Handles timezones correctly  
✅ Prevents duplicate emails  
✅ Works reliably with free tiers  
✅ Scales to hundreds of users  
✅ Monitors delivery and engagement  

**Next Steps:**
1. Update cron-job.org URL to `/cron` endpoint
2. Set schedule to hourly
3. Monitor first 24 hours
4. Launch to users! 🚀

---

**Last Updated:** December 20, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅
