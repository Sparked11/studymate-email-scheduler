# Email Scheduler Testing Guide

## Quick Test Checklist

### ✅ 1. Test Render Service Health
Visit in your browser:
```
https://your-render-url.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "StudyMate.AI Email Scheduler",
  "timestamp": "2025-12-18T..."
}
```

If you see this, your server is running! ✅

---

### ✅ 2. Test Email Sending Manually
Visit in your browser:
```
https://your-render-url.onrender.com/send
```

**Expected Response:**
```json
{
  "success": true,
  "sent": 0,
  "failed": 0
}
```

**What this means:**
- `sent: 0` = No users have email enabled yet (normal)
- If you get this response, Firestore connection works! ✅

---

### ✅ 3. Add Test User in Firebase Console

To test actual email sending:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select: **studymateaikeystorage**
3. Click **Firestore Database**
4. Click **Start collection** (if no collections exist)
5. Create collection: `email_schedules`
6. Add a test document:
   - **Document ID**: `test_user_123` (or any ID)
   - **Fields**:
     ```
     emailEnabled: true (boolean)
     email: "your-email@gmail.com" (string)
     name: "Test User" (string)
     selectedTopics: ["Quiz Performance", "Flashcard Progress", "Lecture Notes", "Study Streaks"] (array)
     ```
7. Click **Save**

---

### ✅ 4. Send Test Email

After adding the test user, visit again:
```
https://your-render-url.onrender.com/send
```

**Expected Response:**
```json
{
  "success": true,
  "sent": 1,
  "failed": 0
}
```

**Check your email inbox!** You should receive a StudyMate.AI daily insights email.

---

### ✅ 5. Check Render Logs

1. Go to your Render dashboard
2. Click on your service
3. Click **Logs** tab
4. You should see:
   ```
   🚀 Starting daily email send...
   ⏰ Time: ...
   ✅ Email sent to your-email@gmail.com
   📊 Summary:
   ✅ Sent: 1
   ❌ Failed: 0
   ```

---

### ✅ 6. Check SendGrid Activity

1. Go to [SendGrid Dashboard](https://app.sendgrid.com/activity)
2. You should see your test email with:
   - Status: **Delivered** ✅
   - To: your email
   - Subject: "📚 Your Daily Study Insights"

---

### ✅ 7. Test Cron Job

1. Go to [cron-job.org](https://cron-job.org)
2. Find your job: "StudyMate Daily Emails"
3. Click **"Execute now"**
4. Check **Execution History**
5. You should see:
   - Status: **Success (200)** ✅
   - Response time: < 5 seconds

---

### ✅ 8. Create Real User Document

For production, users need proper user documents. Create this structure:

**Collection: `users`**
- Document ID: `test_user_123`
- Fields:
  ```
  email: "your-email@gmail.com" (string)
  name: "Test User" (string)
  currentStreak: 5 (number)
  lastActiveDate: "2025-12-18" (string)
  ```

**Collection: `users/test_user_123/study_sessions`**
- Document ID: Auto-generate or use date like `2025-12-18`
- Fields:
  ```
  date: "2025-12-18" (string)
  quizzesCompleted: 3 (number)
  flashcardsReviewed: 15 (number)
  notesCreated: 2 (number)
  studyTime: 45 (number - minutes)
  sessions: 2 (number)
  ```

Then trigger `/send` again - you'll get an email with real stats!

---

## 🐛 Troubleshooting

### Email Not Received?
1. Check spam folder
2. Mark StudyMate email as "Not Spam"
3. Check SendGrid activity for delivery status
4. Verify email address is correct in Firestore

### Cron Job Not Working?
1. Check cron-job.org execution history
2. Verify URL ends with `/send`
3. Check if URL is accessible in browser
4. Render free tier sleeps after inactivity - cron job will wake it

### Render Service Down?
1. Free tier sleeps after 15 min of inactivity
2. First request after sleep takes 30-60 seconds to wake up
3. Cron job will automatically wake it

### No Emails Sent?
1. Check Firestore has `email_schedules` collection
2. Verify documents have `emailEnabled: true`
3. Check Render logs for errors
4. Verify SendGrid API key is valid

---

## 📊 Monitoring Commands

### Check Render Service Status:
```bash
curl https://your-render-url.onrender.com/health
```

### Trigger Email Manually:
```bash
curl https://your-render-url.onrender.com/send
```

### View Logs:
Go to Render Dashboard → Your Service → Logs

---

## ✅ Success Criteria

Your system is working if:
1. ✅ Health endpoint returns 200 OK
2. ✅ Send endpoint returns success (even with 0 sent)
3. ✅ Test email arrives in inbox
4. ✅ Render logs show successful execution
5. ✅ SendGrid shows delivered status
6. ✅ Cron job executes successfully
7. ✅ Email contains correct user data

---

## 🚀 Production Checklist

Before going live with real users:

- [ ] Test email arrives in inbox (not spam)
- [ ] Email displays correctly on mobile
- [ ] Stats are calculated correctly
- [ ] Cron job runs at correct time
- [ ] Render service doesn't crash
- [ ] SendGrid has enough free credits (100/day)
- [ ] Firebase Firestore has proper security rules
- [ ] Users can enable/disable emails in Flutter app
- [ ] Unsubscribe link works (add this later)

---

## 📞 Need Help?

- **Render Issues**: Check Render docs or support
- **SendGrid Issues**: Check SendGrid activity feed
- **Firebase Issues**: Check Firebase console logs
- **Cron Job Issues**: Check cron-job.org execution history
