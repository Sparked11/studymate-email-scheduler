# ⚡ Quick Setup Guide - Smart Scheduling

## 🎯 What This Solves
Users can now set their own preferred email time, and the system respects it!

---

## ✅ Setup Steps (2 minutes)

### 1. Update Your Cron Job ⏰

Go to **cron-job.org** and edit your job:

**Change from:**
```
Daily at 06:00
```

**Change to:**
```
Every hour at minute 0
Pattern: 0 * * * *
```

This means the cron will check every hour and only send to users whose preferred time matches.

---

### 2. Wait for Deployment 🚀

- Code is already pushed to GitHub ✅
- Render will auto-deploy in 1-2 minutes ✅
- No action needed from you! ✅

---

### 3. Test It 🧪

**Wait 2 minutes**, then visit:
```
https://your-render-url.onrender.com/send
```

**You'll see:**
```json
{
  "success": true,
  "sent": 1,      ← Sent to users whose preferred time is NOW
  "failed": 0,
  "skipped": 5,   ← Skipped users (different preferred times)
  "timestamp": "..."
}
```

---

## 📊 How It Works

### Your User's Data:
```
preferredTime: "15:00"  (3 PM UTC)
```

### System Behavior:
- **15:00 UTC:** ✅ Email sent
- **All other hours:** ⏭️ Skipped
- **Already sent today:** ⏭️ Skipped

### Example Timeline:
```
00:00 - Cron runs → User skipped (not their time)
01:00 - Cron runs → User skipped
...
15:00 - Cron runs → ✅ Email sent to user!
16:00 - Cron runs → User skipped (already sent today)
...
23:00 - Cron runs → User skipped
```

---

## 🎨 User Experience

**In your Flutter app**, user sees:
```
┌─────────────────────────────────┐
│ Email Preferences               │
├─────────────────────────────────┤
│ Email Notifications: ✅ ON      │
│                                 │
│ Preferred Time:                 │
│ ┌─────────────┐                │
│ │  3:00 PM  ▼ │                │
│ └─────────────┘                │
│                                 │
│ Topics:                         │
│ ☑ Quiz Performance             │
│ ☑ Study Streaks                │
│ ☑ Flashcard Progress           │
│                                 │
│      [ Save Preferences ]       │
└─────────────────────────────────┘
```

**Behind the scenes:**
- User selects "3:00 PM" in their timezone
- App converts to UTC and stores "15:00" (or appropriate UTC hour)
- System sends email at that UTC hour
- User receives email at their local 3:00 PM!

---

## ⚠️ Important: Timezone Handling

### Current Setup:
Your Firestore has `preferredTime: "15:00"` which is **3 PM UTC**.

### If User is in Different Timezone:
- **User in EST (UTC-5):** 15:00 UTC = 10:00 AM EST
- **User in PST (UTC-8):** 15:00 UTC = 7:00 AM PST

### Solution:
In your Flutter app, convert user's local time to UTC before saving:

```dart
// Pseudo-code
String convertToUTC(TimeOfDay localTime) {
  final local = DateTime(2025, 1, 1, localTime.hour, localTime.minute);
  final utc = local.toUtc();
  return '${utc.hour.toString().padLeft(2, '0')}:00';
}

// When saving:
final utcTime = convertToUTC(selectedTime);
await db.collection('email_schedules').doc(uid).set({
  'preferredTime': utcTime, // Stored as UTC
  ...
});
```

**Or** use a timezone library and store timezone separately.

---

## 📈 Costs & Limits

### Free Tier Usage:

**Render:**
- 24 HTTP requests/day (one per hour) ✅
- May sleep after 15min (normal for free tier) ✅

**Cron-job.org:**
- Unlimited hourly jobs ✅

**SendGrid:**
- 100 emails/day ✅
- Spread across 24 hours ✅

### Real-World Example:
- **10 users:** Each gets 1 email/day at their preferred time
- **Total:** 10 emails/day across different hours
- **Cost:** $0 (within all free tiers)

---

## 🔍 Monitoring

### Check if Working:

**Option 1 - Render Logs:**
```
🚀 Starting daily email send...
⏰ UTC Hour: 15:00
📧 Sending to user@example.com (preferred time: 15:00)
✅ Email sent successfully
⏰ Skipping otheruser@example.com (preferred: 21:00)
```

**Option 2 - Test Endpoint:**
```bash
curl https://your-url.onrender.com/send
```

Response shows sent/skipped counts.

---

## 🚀 You're Done!

### What You Have Now:
✅ Smart time-based email system  
✅ Each user gets emails at their preferred time  
✅ No duplicate emails per day  
✅ Fully automated via hourly cron  
✅ Respects user preferences  
✅ Production-ready!

### Next Steps:
1. Change cron-job.org to hourly ⏰
2. Wait 2 minutes for Render deploy 🚀
3. Test with `/send` endpoint 🧪
4. You're ready to launch! 🎉

---

## 🆘 Troubleshooting

**Q: User says they didn't get email at preferred time**
- Check Firestore: Is `preferredTime` set?
- Check Render logs: Was email sent?
- Check SendGrid: Was email delivered?
- Check timezone: Is UTC conversion correct?

**Q: All users get email at once**
- Did you change cron to hourly?
- Check that `preferredTime` values are different
- Verify logs show "Skipping" messages

**Q: No emails sent**
- Check if any user's `preferredTime` matches current UTC hour
- Check Render is awake (free tier sleeps)
- Check SendGrid API key is valid

---

## 📞 Support

If you need help:
1. Check Render logs
2. Check SendGrid activity dashboard
3. Test `/send` endpoint and share response
4. Share relevant log messages

Your system is production-ready! 🎊
