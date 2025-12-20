# PRE-PRODUCTION CHECKLIST - MUST COMPLETE BEFORE APP LAUNCH

## ⚠️ CRITICAL: Complete ALL steps before publishing your app

### ✅ Step 1: Verify Render Service is Live
- [ ] Go to Render dashboard
- [ ] Confirm service shows **"Live"** with green dot
- [ ] Copy your service URL (looks like: https://studymate-email-scheduler-xxxx.onrender.com)
- [ ] Write it here: _________________________________

### ✅ Step 2: Test Health Endpoint
Visit in browser: `https://your-url.onrender.com/health`

**Expected:** 
```json
{"status":"ok","service":"StudyMate.AI Email Scheduler","timestamp":"2025-12-18..."}
```

- [ ] I see the "ok" status ✅

### ✅ Step 3: Create Test User in Firestore

1. [ ] Go to Firebase Console → studymateaikeystorage → Firestore Database
2. [ ] Confirm `email_schedules` collection exists
3. [ ] Add TEST document:
   - Document ID: `TEST_USER_DELETE_LATER`
   - Fields:
     - `emailEnabled`: true (boolean)
     - `email`: "YOUR_REAL_EMAIL@gmail.com" (string)
     - `name`: "Test User" (string)
     - `selectedTopics`: ["Quiz Performance", "Flashcard Progress", "Lecture Notes", "Study Streaks"] (array)
4. [ ] Saved successfully

### ✅ Step 4: Send Test Email NOW
Visit: `https://your-url.onrender.com/send`

**Expected Response:**
```json
{"success":true,"sent":1,"failed":0}
```

- [ ] I got "sent": 1 ✅
- [ ] Email arrived in my inbox within 2 minutes ✅
- [ ] Email is NOT in spam folder (if it is, mark as "Not Spam") ✅
- [ ] Email looks professional and displays correctly ✅

### ✅ Step 5: Verify Cron Job Setup
1. [ ] Go to cron-job.org
2. [ ] Find job: "StudyMate Daily Emails"
3. [ ] Confirm URL ends with `/send`
4. [ ] Confirm schedule is correct (e.g., "0 9 * * *" for 9 AM)
5. [ ] Click "Execute now" to test
6. [ ] Check execution history - shows "Success (200)" ✅

### ✅ Step 6: Verify Flutter App Integration

**Check these files in your Flutter app:**

1. [ ] `lib/email_preferences_page.dart` exists
2. [ ] Users can enable/disable email notifications
3. [ ] Users can select email topics
4. [ ] Users can set preferred send time
5. [ ] Data saves to Firestore `email_schedules` collection

**Test in your Flutter app:**
1. [ ] Open Email Preferences page
2. [ ] Enable email notifications
3. [ ] Select some topics
4. [ ] Click "Save Preferences"
5. [ ] Go to Firebase Console → Firestore → email_schedules
6. [ ] Confirm your user document was created with:
   - `emailEnabled: true`
   - `email: your-email`
   - `name: your-name`
   - `selectedTopics: [...]`

### ✅ Step 7: Send REAL Email to Yourself
After saving preferences in Flutter app:

1. [ ] Visit: `https://your-url.onrender.com/send`
2. [ ] Check response: "sent": 1 or more
3. [ ] Email arrives with YOUR NAME in the greeting ✅
4. [ ] Email shows your selected topics only ✅

### ✅ Step 8: Verify User Stats Collection

For emails to show real data, users need stats. Check if your app saves:

**Required Firestore structure:**
```
users/{userId}
  - email: string
  - name: string
  - currentStreak: number
  - lastActiveDate: string (YYYY-MM-DD)
  
users/{userId}/study_sessions/{date}
  - quizzesCompleted: number
  - flashcardsReviewed: number
  - notesCreated: number
  - studyTime: number (minutes)
  - sessions: number
```

- [ ] My Flutter app saves user data to `users` collection
- [ ] My Flutter app tracks study sessions
- [ ] I can see study_sessions subcollection in Firestore

**If NOT tracking stats yet:**
- Emails will still send, but with 0 values
- You can add tracking later without breaking emails

### ✅ Step 9: SendGrid Verification

1. [ ] Go to SendGrid Dashboard → Activity
2. [ ] See your test email with status "Delivered"
3. [ ] Verify "From" shows: studymateai.info@gmail.com
4. [ ] Check remaining free tier credits (100 emails/day)

### ✅ Step 10: Production Readiness

- [ ] Delete test user from Firestore (TEST_USER_DELETE_LATER)
- [ ] Render service is on FREE tier (not trial)
- [ ] SendGrid account is verified and active
- [ ] Cron job is ENABLED
- [ ] Cron job schedule matches user expectations
- [ ] Firebase Firestore has proper security rules (check below)

### ✅ Step 11: Firestore Security Rules

⚠️ **IMPORTANT:** Set up security rules so users can only read/write their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Email schedules - users can only access their own
    match /email_schedules/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users collection - users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Study sessions subcollection
      match /study_sessions/{session} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

1. [ ] Go to Firebase Console → Firestore → Rules
2. [ ] Copy the rules above
3. [ ] Click "Publish"
4. [ ] Test in Flutter app - can still save data ✅

---

## 🎯 FINAL VERIFICATION

### Do this RIGHT BEFORE publishing:

1. [ ] Visit health endpoint - returns "ok"
2. [ ] Visit send endpoint - returns success
3. [ ] Check cron-job.org - last execution was successful
4. [ ] Check Render logs - no errors in last 24 hours
5. [ ] SendGrid has > 50 free emails remaining
6. [ ] At least 1 real email test completed successfully

---

## 📊 Expected Behavior After Launch

**What happens when users enable emails:**

1. User opens your app
2. Goes to Email Preferences page
3. Toggles email notifications ON
4. Selects topics they want
5. Saves preferences → Data saved to Firestore `email_schedules`
6. Next day at scheduled time:
   - Cron job triggers your Render service
   - Service queries Firestore for users with emailEnabled=true
   - Calculates stats from study_sessions
   - Sends personalized email via SendGrid
   - User receives email in inbox

**Daily capacity:** 100 emails/day (SendGrid free tier)

---

## 🚨 What to Monitor After Launch

### Daily (First Week):
- [ ] Check cron-job.org execution history
- [ ] Check Render logs for errors
- [ ] Check SendGrid activity for delivery rate
- [ ] Monitor user feedback about emails

### Weekly:
- [ ] Review email open rates in SendGrid
- [ ] Check Render service uptime
- [ ] Verify cron job is still running
- [ ] Check Firebase usage quotas

---

## 🐛 Common Issues & Fixes

### Users not receiving emails?
1. Check if emailEnabled is true in their document
2. Verify their email address is correct
3. Check SendGrid activity - might be in spam
4. Ask users to check spam folder

### Emails show 0 stats?
1. Check if app is saving to study_sessions
2. Verify data structure matches expected format
3. Emails will still send, just with zeros

### Render service down?
1. Free tier sleeps after 15 min inactivity
2. Cron job wakes it up automatically
3. First request after sleep takes 30-60 seconds

### Hit SendGrid limit (100/day)?
1. Upgrade to paid plan ($19.95/month for 40K emails)
2. Or implement email batching/priority

---

## ✅ SIGN-OFF

**I certify that I have:**
- [ ] Tested health endpoint successfully
- [ ] Sent test email to myself and received it
- [ ] Verified cron job executes successfully
- [ ] Tested email preferences in Flutter app
- [ ] Checked Firestore security rules
- [ ] Monitored SendGrid delivery status
- [ ] Verified Render service is live
- [ ] Deleted all test users from Firestore

**Date completed:** _________________
**Your signature:** _________________

---

## 🚀 YOU'RE READY TO LAUNCH!

If all boxes are checked, your daily email system is production-ready! 🎉

**Support contacts:**
- Render issues: https://render.com/docs
- SendGrid issues: https://app.sendgrid.com/support
- Firebase issues: https://firebase.google.com/support
