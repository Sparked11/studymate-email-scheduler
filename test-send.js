/**
 * Manual Test Script - Send Email to Specific User
 * 
 * This will send a test email to verify the system works
 */

const admin = require('firebase-admin');
const fetch = require('node-fetch');
require('dotenv').config();

// Environment Variables
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'studymateaikeystorage';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;
const FROM_EMAIL = 'studymateai.info@gmail.com';

// Validate environment variables
if (!SENDGRID_API_KEY) {
  console.error('❌ ERROR: SENDGRID_API_KEY environment variable is required');
  process.exit(1);
}

if (!FIREBASE_SERVICE_ACCOUNT) {
  console.error('❌ ERROR: FIREBASE_SERVICE_ACCOUNT environment variable is required');
  process.exit(1);
}

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
} catch (error) {
  console.error('❌ ERROR: Invalid FIREBASE_SERVICE_ACCOUNT JSON:', error.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: FIREBASE_PROJECT_ID
});

const db = admin.firestore();

/**
 * Get user statistics from Firestore
 */
async function getUserStats(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    // Get daily stats from yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateKey = yesterday.toISOString().split('T')[0];
    
    const statsDoc = await db
      .collection('users')
      .doc(userId)
      .collection('daily_stats')
      .doc(dateKey)
      .get();
    
    const stats = statsDoc.exists ? statsDoc.data() : {};
    
    return {
      userName: userData?.displayName || 'Student',
      sessions: stats.studySessions || 0,
      minutes: stats.totalMinutes || 0,
      flashcards: stats.flashcardsReviewed || 0,
      quizzes: stats.quizzesTaken || 0,
      notes: stats.notesCreated || 0,
      currentStreak: userData?.currentStreak || 0
    };
  } catch (error) {
    console.error(`Error fetching stats for user ${userId}:`, error);
    return {
      userName: 'Student',
      sessions: 0,
      minutes: 0,
      flashcards: 0,
      quizzes: 0,
      notes: 0,
      currentStreak: 0
    };
  }
}

/**
 * Send email via SendGrid
 */
async function sendEmail(toEmail, userName, stats, topics) {
  try {
    console.log(`📧 Sending email to ${toEmail} (${userName})...`);
    
    const htmlContent = generateEmailHTML(userName, stats, topics);
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: toEmail }],
          subject: '📚 Your Daily Study Insights from StudyMate.AI'
        }],
        from: {
          email: FROM_EMAIL,
          name: 'StudyMate.AI'
        },
        content: [{
          type: 'text/html',
          value: htmlContent
        }]
      })
    });

    if (response.ok) {
      console.log(`✅ Email sent successfully to ${toEmail}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ SendGrid error for ${toEmail}:`, response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error sending email to ${toEmail}:`, error.message);
    return false;
  }
}

/**
 * Generate HTML email content
 */
function generateEmailHTML(userName, stats, topics) {
  const isActive = stats.sessions > 0 || stats.minutes > 0;
  
  let features = '';
  if (topics && topics.length > 0) {
    const activityMap = {
      'Quiz Performance': stats.quizzes > 0 ? `✅ Completed ${stats.quizzes} quiz${stats.quizzes !== 1 ? 'zes' : ''}` : '📝 No quizzes taken yet',
      'Flashcard Progress': stats.flashcards > 0 ? `📇 Reviewed ${stats.flashcards} flashcard${stats.flashcards !== 1 ? 's' : ''}` : '📇 No flashcards reviewed yet',
      'Lecture Notes': stats.notes > 0 ? `📄 Created ${stats.notes} note${stats.notes !== 1 ? 's' : ''}` : '📄 No notes created yet',
      'Study Streaks': stats.currentStreak > 0 ? `🔥 ${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''} streak!` : '🔥 Start your streak today!'
    };
    
    features = topics.map(topic => {
      const activity = activityMap[topic] || `📊 ${topic}: Track your progress`;
      return `<div class="activity-item">${activity}</div>`;
    }).join('');
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Daily Study Insights</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      font-size: 42px;
      margin-bottom: 10px;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 20px;
      color: #1f2937;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .section-title {
      color: #667eea;
      font-size: 18px;
      font-weight: 600;
      margin: 30px 0 15px;
    }
    .stats-grid {
      display: flex;
      gap: 15px;
      margin: 20px 0;
    }
    .stat-card {
      flex: 1;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      padding: 20px;
      border-radius: 12px;
      text-align: center;
    }
    .stat-number {
      display: block;
      font-size: 32px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 5px;
    }
    .stat-label {
      display: block;
      font-size: 13px;
      color: #6b7280;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .activity-list {
      background: #f9fafb;
      padding: 20px;
      border-radius: 12px;
      margin: 15px 0;
    }
    .activity-item {
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
      color: #374151;
      font-size: 15px;
    }
    .activity-item:last-child {
      border-bottom: none;
    }
    .tip-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      padding: 20px;
      border-radius: 12px;
      border-left: 4px solid #f59e0b;
      margin: 25px 0;
      color: #92400e;
      font-size: 14px;
      line-height: 1.6;
    }
    .footer {
      background: #f9fafb;
      padding: 25px 30px;
      text-align: center;
      color: #6b7280;
      font-size: 13px;
      line-height: 1.8;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">📚</div>
      <h1>Your Daily Study Insights</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hey ${userName}! 👋</p>
      
      ${isActive ? `
      <p>Great job studying! Here's your activity summary:</p>
      
      <h3 class="section-title">📈 Yesterday's Progress</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-number">${stats.minutes}</span>
          <span class="stat-label">Minutes</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">${stats.sessions}</span>
          <span class="stat-label">Sessions</span>
        </div>
      </div>
      ` : `
      <p>We noticed you haven't studied recently. No worries - every expert was once a beginner! 🌱</p>
      <p style="color: #6b7280; font-size: 15px; margin: 20px 0;">Start a study session today to build your streak and track your progress.</p>
      `}
      
      ${stats.currentStreak > 0 ? `
      <div style="text-align: center; margin: 24px 0;">
        <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 16px 32px; border-radius: 50px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
          <span style="font-size: 28px;">🔥</span>
          <span style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 8px;">${stats.currentStreak} Day${stats.currentStreak !== 1 ? 's' : ''}</span>
          <span style="color: rgba(255, 255, 255, 0.9); font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Streak</span>
        </div>
        <p style="color: #6b7280; font-size: 13px; margin-top: 12px;">Keep it up! Don't break the chain 💪</p>
      </div>
      ` : ''}
      
      ${features ? `
      <h3 class="section-title">📊 Your Activity Breakdown</h3>
      <div class="activity-list">${features}</div>
      ` : ''}
      
      <div class="tip-box">
        <strong>💡 Pro Tip</strong>
        Spaced repetition is proven to improve long-term retention. Try reviewing your flashcards daily for best results!
      </div>
    </div>
    
    <div class="footer">
      <p>You're receiving this email because you've enabled daily insights in your StudyMate.AI account.</p>
      <p><a href="https://studymateai.info">Website</a> • <a href="mailto:studymateai.info@gmail.com">Support</a></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Main test function
 */
async function runTest() {
  console.log('🧪 Starting manual email test...');
  console.log('📅 Time:', new Date().toISOString());
  console.log('');
  
  try {
    // Get the specific user from email_schedules
    const userId = 'FxZVYxrbpNUyI6VwnpJCqQlTJnG2'; // Your user ID
    const scheduleDoc = await db.collection('email_schedules').doc(userId).get();
    
    if (!scheduleDoc.exists) {
      console.error('❌ User not found in email_schedules collection');
      process.exit(1);
    }
    
    const schedule = scheduleDoc.data();
    console.log('👤 User found:', schedule.userName);
    console.log('📧 Email:', schedule.email);
    console.log('✅ Email enabled:', schedule.emailEnabled);
    console.log('📋 Topics:', schedule.interestedTopics || schedule.selectedTopics);
    console.log('');
    
    if (!schedule.emailEnabled) {
      console.error('❌ Email is disabled for this user');
      process.exit(1);
    }
    
    // Get user stats
    console.log('📊 Fetching user stats...');
    const stats = await getUserStats(userId);
    console.log('Stats:', stats);
    console.log('');
    
    // Send email
    const topics = schedule.interestedTopics || schedule.selectedTopics || [];
    const success = await sendEmail(
      schedule.email,
      schedule.userName || 'Student',
      stats,
      topics
    );
    
    if (success) {
      console.log('');
      console.log('✅ TEST COMPLETED SUCCESSFULLY!');
      console.log('📬 Check your inbox:', schedule.email);
      console.log('⏰ Email should arrive within 1-2 minutes');
      console.log('💡 Don\'t forget to check your spam folder!');
      
      // Update lastEmailSent
      await db.collection('email_schedules').doc(userId).update({
        lastEmailSent: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('📝 Updated lastEmailSent timestamp');
    } else {
      console.error('');
      console.error('❌ TEST FAILED - Email not sent');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the test
runTest();
