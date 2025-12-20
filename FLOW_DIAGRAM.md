# 📅 Smart Scheduling Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CRON-JOB.ORG                                │
│                    (Runs every hour at :00)                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RENDER.COM (Node.js Server)                       │
│                                                                      │
│  GET /send → sendDailyEmails()                                      │
│                                                                      │
│  1. Query Firestore: email_schedules collection                     │
│  2. For each user:                                                  │
│     ├─ Check: emailEnabled == true?                                 │
│     ├─ Check: preferredTime matches current hour?                   │
│     ├─ Check: already sent today?                                   │
│     └─ If all YES → Send email via SendGrid                         │
│                                                                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
    ┌─────────┐        ┌─────────┐        ┌─────────┐
    │Firebase │        │SendGrid │        │Response │
    │Firestore│        │ Email   │        │  JSON   │
    └─────────┘        └─────────┘        └─────────┘
```

---

## 🕐 24-Hour Example Timeline

### Setup:
- **User A:** preferredTime = "06:00" (6 AM UTC)
- **User B:** preferredTime = "15:00" (3 PM UTC)
- **User C:** preferredTime = "21:00" (9 PM UTC)

### Hourly Execution:

```
00:00 UTC ─┐
           ├─ Cron runs → Checks all users → Nobody matches → Skips all
01:00 UTC ─┤
           ├─ Cron runs → Checks all users → Nobody matches → Skips all
...        │
06:00 UTC ─┤
           ├─ Cron runs → ✅ USER A MATCHES! → Sends email to User A
07:00 UTC ─┤                                   User A skipped (already sent)
           ├─ Cron runs → Checks all users → Nobody matches → Skips all
...        │
15:00 UTC ─┤
           ├─ Cron runs → ✅ USER B MATCHES! → Sends email to User B
16:00 UTC ─┤                                   User B skipped (already sent)
           ├─ Cron runs → Checks all users → Nobody matches → Skips all
...        │
21:00 UTC ─┤
           ├─ Cron runs → ✅ USER C MATCHES! → Sends email to User C
22:00 UTC ─┤                                   User C skipped (already sent)
           └─ Cron runs → Checks all users → Nobody matches → Skips all
```

**Result:**
- User A gets email at 6 AM ✅
- User B gets email at 3 PM ✅
- User C gets email at 9 PM ✅
- No duplicates, no spam! ✅

---

## 🔄 Decision Flow for Each User

```
                    ┌─────────────────┐
                    │  Cron triggers  │
                    │   /send at :00  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Get all users   │
                    │ from Firestore  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ For each user:  │
                    └────────┬────────┘
                             │
             ┌───────────────┴───────────────┐
             ▼                               │
    ┌─────────────────┐                     │
    │ emailEnabled?   │                     │
    └────────┬────────┘                     │
             │                               │
        YES  │  NO → Skip user               │
             ▼                               │
    ┌─────────────────┐                     │
    │ preferredTime   │                     │
    │ matches current │                     │
    │    UTC hour?    │                     │
    └────────┬────────┘                     │
             │                               │
        YES  │  NO → Skip user               │
             ▼                               │
    ┌─────────────────┐                     │
    │ Already sent    │                     │
    │    today?       │                     │
    └────────┬────────┘                     │
             │                               │
         NO  │  YES → Skip user              │
             ▼                               │
    ┌─────────────────┐                     │
    │ ✅ SEND EMAIL!  │                     │
    │                 │                     │
    │ 1. Get stats    │                     │
    │ 2. Send via     │                     │
    │    SendGrid     │                     │
    │ 3. Update       │                     │
    │    lastEmailSent│                     │
    └─────────────────┘                     │
             │                               │
             └───────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Continue to     │
                    │ next user       │
                    └─────────────────┘
```

---

## 🗄️ Firestore Data Structure

```
email_schedules/
│
├── {userId_1}/
│   ├── email: "user1@example.com"
│   ├── emailEnabled: true
│   ├── preferredTime: "06:00"         ← User's preferred hour (UTC)
│   ├── lastEmailSent: Timestamp       ← Last time email was sent
│   ├── userName: "John Doe"
│   └── interestedTopics: [...]
│
├── {userId_2}/
│   ├── email: "user2@example.com"
│   ├── emailEnabled: true
│   ├── preferredTime: "15:00"         ← Different time!
│   ├── lastEmailSent: Timestamp
│   ├── userName: "Jane Smith"
│   └── interestedTopics: [...]
│
└── {userId_3}/
    ├── email: "user3@example.com"
    ├── emailEnabled: false             ← Disabled, always skipped
    ├── preferredTime: "21:00"
    └── ...
```

---

## 📊 Response Format

### Successful Run:
```json
{
  "success": true,
  "sent": 3,        ← Emails successfully sent this hour
  "failed": 0,      ← Failed attempts
  "skipped": 47,    ← Users skipped (wrong time or already sent)
  "timestamp": "2025-12-20T15:00:00.000Z"
}
```

### No Matches This Hour:
```json
{
  "success": true,
  "sent": 0,        ← Nobody scheduled for this hour
  "failed": 0,
  "skipped": 50,    ← All users skipped
  "timestamp": "2025-12-20T15:00:00.000Z"
}
```

### Error:
```json
{
  "success": false,
  "error": "Cannot find module 'protobufjs'",
  "timestamp": "2025-12-20T15:00:00.000Z"
}
```

---

## 🌍 Timezone Consideration

### Example: User in New York (EST, UTC-5)

**User wants:** Email at 10:00 AM local time (EST)

**Conversion:**
```
10:00 AM EST = 10:00 + 5 hours = 15:00 UTC
```

**Flutter App (when user saves):**
```dart
// User selects 10:00 AM in local time
TimeOfDay localTime = TimeOfDay(hour: 10, minute: 0);

// Convert to UTC
DateTime local = DateTime.now().copyWith(
  hour: localTime.hour, 
  minute: localTime.minute
);
DateTime utc = local.toUtc();

// Save as "HH:mm" format
String preferredTimeUTC = '${utc.hour.toString().padLeft(2, '0')}:00';
// Result: "15:00"

// Store in Firestore
await Firestore.instance
  .collection('email_schedules')
  .doc(userId)
  .set({
    'preferredTime': preferredTimeUTC,  // "15:00"
    ...
  });
```

**Backend (when cron runs at 15:00 UTC):**
```
Current UTC: 15:00
User preferredTime: "15:00"
Match! → Send email
User receives at: 10:00 AM EST (their local time)
```

---

## 🎯 Key Points

### ✅ Advantages:
1. **Personalized:** Each user gets emails when they want
2. **No spam:** Max 1 email per user per day
3. **Scalable:** Works with 10 or 10,000 users
4. **Free:** Fits within all free tier limits
5. **Reliable:** Hourly checks ensure delivery

### ⚠️ Considerations:
1. **Render sleep:** Free tier may sleep, first run after sleep takes 30-60s
2. **Timezone conversion:** Must handle in Flutter app
3. **Hourly granularity:** Users can only choose by hour, not minute
4. **UTC-based:** All times stored/compared in UTC

### 🚀 Production Ready:
- ✅ Error handling
- ✅ Rate limiting (100ms between emails)
- ✅ Duplicate prevention
- ✅ Logging and monitoring
- ✅ Backward compatible

---

## 📱 User Flow in App

```
1. User opens Email Preferences
   ↓
2. User toggles "Enable Email Notifications" ON
   ↓
3. User selects preferred time from picker
   │  ┌─────────────┐
   │  │  3:00 PM  ▼ │
   │  └─────────────┘
   ↓
4. App converts local time to UTC
   (3:00 PM EST → 20:00 UTC)
   ↓
5. App saves to Firestore:
   {
     emailEnabled: true,
     preferredTime: "20:00",
     ...
   }
   ↓
6. Backend checks every hour at :00
   ↓
7. When 20:00 UTC arrives:
   ✅ Email sent!
   ↓
8. User receives email at 3:00 PM EST
   (their local time)
```

---

## 🎉 Result

**Before:**
- All users got emails at 6 AM UTC
- Inconvenient for users in different timezones
- Fixed schedule, no flexibility

**After:**
- Each user gets emails at their preferred time
- Timezone-aware (with proper conversion)
- Personalized experience
- Production-ready!

Your email system is now **intelligent, scalable, and user-friendly**! 🚀
