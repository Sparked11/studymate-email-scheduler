/**
 * Daily Email Scheduler for StudyMate.AI
 * This script sends daily insight emails to all users with email enabled
 * 
 * Deploy to: Heroku, Vercel, Railway, or any Node.js host
 * Trigger with: cron-job.org or GitHub Actions
 */

const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Environment Variables
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'studymateaikeystorage';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;
const FROM_EMAIL = 'studymateai.info@gmail.com';

// Validate environment variables
if (!SENDGRID_API_KEY) {
  console.error('ERROR: SENDGRID_API_KEY environment variable is required');
  process.exit(1);
}

if (!FIREBASE_SERVICE_ACCOUNT) {
  console.error('ERROR: FIREBASE_SERVICE_ACCOUNT environment variable is required');
  process.exit(1);
}

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
} catch (error) {
  console.error('ERROR: Invalid FIREBASE_SERVICE_ACCOUNT JSON:', error.message);
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
      quizzesCompleted: stats.quizzesCompleted || 0,
      flashcardsReviewed: stats.flashcardsReviewed || 0,
      notesCreated: stats.notesCreated || 0,
      studyTime: stats.studyTime || 0,
      sessions: stats.sessions || 0,
      currentStreak: userData.currentStreak || 0
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      quizzesCompleted: 0,
      flashcardsReviewed: 0,
      notesCreated: 0,
      studyTime: 0,
      sessions: 0,
      currentStreak: 0
    };
  }
}

/**
 * Build email HTML
 */
function buildEmailHTML(name, stats, selectedTopics) {
  const hours = Math.floor(stats.studyTime / 60);
  const minutes = stats.studyTime % 60;
  
  // Filter features based on selected topics
  const topicMap = {
    'Quiz Performance': stats.quizzesCompleted > 0 ? `Quizzes Completed: ${stats.quizzesCompleted}` : null,
    'Flashcard Progress': stats.flashcardsReviewed > 0 ? `Flashcards Reviewed: ${stats.flashcardsReviewed}` : null,
    'Lecture Notes': stats.notesCreated > 0 ? `Notes Created: ${stats.notesCreated}` : null,
  };
  
  const features = Object.entries(topicMap)
    .filter(([topic]) => selectedTopics.includes(topic))
    .filter(([_, value]) => value !== null)
    .map(([_, value]) => `<div class="activity-item">${value} times</div>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .email-wrapper { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; }
    .email-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center; color: white; }
    .header h1 { margin: 0 0 8px 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 32px; }
    .greeting { font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 16px; }
    .stats-container { margin: 24px 0; }
    .stats-row { display: flex; gap: 16px; justify-content: space-around; }
    .stat-box { flex: 1; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 20px; border-radius: 12px; text-align: center; }
    .stat-number { display: block; font-size: 32px; font-weight: 700; color: #667eea; margin-bottom: 4px; }
    .stat-label { display: block; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .section-title { color: #1f2937; font-size: 18px; font-weight: 600; margin: 24px 0 12px 0; }
    .activity-list { background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #667eea; }
    .activity-item { padding: 8px 0; color: #4b5563; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
    .activity-item:last-child { border-bottom: none; }
    .tip-box { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #f59e0b; }
    .tip-box strong { color: #92400e; display: block; margin-bottom: 4px; }
    .footer { background: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 12px; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="header">
        <h1>📚 Your Daily Study Insights</h1>
        <p>Your progress summary from StudyMate.AI</p>
      </div>
      
      <div class="content">
        <div class="greeting">Hi ${name}! 👋</div>
        
        <p style="color: #4b5563; font-size: 15px; margin-bottom: 24px;">
          Great job staying consistent with your studies! Here's a summary of your learning activity:
        </p>
        
        <div class="stats-container">
          <div class="stats-row">
            <div class="stat-box">
              <span class="stat-number">${hours}h ${minutes}m</span>
              <span class="stat-label">Study Time</span>
            </div>
            <div class="stat-box">
              <span class="stat-number">${stats.sessions}</span>
              <span class="stat-label">Sessions</span>
            </div>
          </div>
        </div>
        
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
  </div>
</body>
</html>`;
}

/**
 * Send email via SendGrid
 */
async function sendEmail(toEmail, toName, stats, selectedTopics, quietMode = false) {
  const emailBody = {
    personalizations: [{
      to: [{ email: toEmail, name: toName }],
      subject: '📚 Your Daily Study Insights'
    }],
    from: {
      email: FROM_EMAIL,
      name: 'StudyMate.AI'
    },
    content: [{
      type: 'text/html',
      value: buildEmailHTML(toName, stats, selectedTopics)
    }],
    tracking_settings: {
      click_tracking: { enable: true },
      open_tracking: { enable: true }
    }
  };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailBody)
  });

  if (response.status === 202) {
    if (!quietMode) {
      console.log(`✅ Email sent to ${toEmail}`);
    }
    return true;
  } else {
    const error = await response.text();
    if (!quietMode) {
      console.error(`❌ Failed to send email to ${toEmail}:`, error);
    }
    return false;
  }
}

/**
 * Check if it's time to send email to a user based on their preferred time
 */
function shouldSendEmail(schedule) {
  const now = new Date();
  const currentHour = now.getUTCHours(); // Use UTC for consistency
  
  // Get user's preferred time (format: "HH:mm" like "15:00")
  const preferredTime = schedule.preferredTime;
  
  if (!preferredTime) {
    // No preferred time set, send every time (backward compatibility)
    return true;
  }
  
  // Parse preferred hour from "HH:mm" format
  const preferredHour = parseInt(preferredTime.split(':')[0], 10);
  
  // Check if we're in the user's preferred hour
  // Allow a 1-hour window to account for timing variations
  if (currentHour === preferredHour || currentHour === preferredHour - 1) {
    return true;
  }
  
  // Check if email was already sent today
  if (schedule.lastEmailSent) {
    const lastSent = schedule.lastEmailSent.toDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (lastSent >= today) {
      // Already sent today, skip
      return false;
    }
  }
  
  return false;
}

/**
 * Main function to send daily emails
 * @param {boolean} quietMode - If true, suppress detailed console logs
 */
async function sendDailyEmails(quietMode = false) {
  if (!quietMode) {
    console.log('🚀 Starting daily email send...');
    const now = new Date();
    console.log(`⏰ Time: ${now.toISOString()}`);
    console.log(`⏰ UTC Hour: ${now.getUTCHours()}:00`);
  }
  
  try {
    // Get all email schedules
    const schedulesSnapshot = await db.collection('email_schedules').get();
    
    if (schedulesSnapshot.empty) {
      if (!quietMode) console.log('📭 No email schedules found');
      return { success: true, sent: 0, failed: 0, skipped: 0 };
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const doc of schedulesSnapshot.docs) {
      const schedule = doc.data();
      
      // Check if email is enabled
      if (!schedule.emailEnabled) {
        if (!quietMode) console.log(`⏭️  Skipping ${schedule.email} - emails disabled`);
        skipped++;
        continue;
      }

      // Check if it's the right time for this user
      if (!shouldSendEmail(schedule)) {
        if (!quietMode) console.log(`⏰ Skipping ${schedule.email} - not scheduled for this hour (preferred: ${schedule.preferredTime || 'not set'})`);
        skipped++;
        continue;
      }

      if (!quietMode) console.log(`📧 Sending to ${schedule.email} (preferred time: ${schedule.preferredTime || 'any time'})`);

      // Get user stats
      const stats = await getUserStats(doc.id);
      
      // Get topics (support both field names for compatibility)
      const topics = schedule.selectedTopics || schedule.interestedTopics || [];
      
      // Send email
      const success = await sendEmail(
        schedule.email,
        schedule.userName || schedule.name || 'Student',
        stats,
        topics,
        quietMode
      );

      if (success) {
        sent++;
        
        // Update last sent timestamp
        await doc.ref.update({
          lastEmailSent: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        failed++;
      }

      // Rate limiting - wait 100ms between emails
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!quietMode) {
      console.log(`\n📊 Summary:`);
      console.log(`✅ Sent: ${sent}`);
      console.log(`❌ Failed: ${failed}`);
      console.log(`⏭️  Skipped: ${skipped}`);
      console.log(`📝 Total processed: ${sent + failed + skipped}`);
    }

    return { success: true, sent, failed, skipped };
  } catch (error) {
    if (!quietMode) {
      console.error('❌ Error sending daily emails:', error);
    }
    return { success: false, error: error.message };
  }
}

// Create HTTP server for Render
const http = require('http');

const server = http.createServer(async (req, res) => {
  // Health check endpoint
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'StudyMate.AI Email Scheduler',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Ultra-silent cron endpoint - returns HTTP 204 (No Content)
  // Use this for cron-job.org to avoid "output too large" errors
  if (req.url === '/cron') {
    try {
      // Fire and forget - don't wait for completion
      sendDailyEmails(true).catch(() => {});
      
      // Return immediately with NO content (zero bytes)
      res.writeHead(204); // 204 = No Content
      res.end();
    } catch {
      // Even on error, return 204
      res.writeHead(204);
      res.end();
    }
    return;
  }
  
  // Trigger email sending
  if (req.url === '/send' || req.url === '/trigger') {
    // Suppress detailed logs for cron jobs (they have output limits)
    const isCronJob = req.headers['user-agent']?.includes('cron-job.org') || false;
    
    if (!isCronJob) {
      console.log('📧 Email send triggered via HTTP request');
    }
    
    try {
      const result = await sendDailyEmails(isCronJob);
      
      // For cron jobs, return ULTRA minimal response
      if (isCronJob) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: 1, s: result.sent || 0 }));
        return;
      }
      
      // For manual requests, return full response
      const response = {
        success: result.success,
        sent: result.sent || 0,
        failed: result.failed || 0,
        skipped: result.skipped || 0,
        timestamp: new Date().toISOString()
      };
      
      // If sendDailyEmails returned an error, include it
      if (result.error) {
        response.error = result.error;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } catch (error) {
      if (!isCronJob) {
        console.error('❌ HTTP handler error:', error);
      }
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }));
    }
    return;
  }
  
  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    error: 'Not found',
    availableEndpoints: ['/health', '/send', '/trigger']
  }));
});

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`🚀 Email scheduler server running on port ${PORT}`);
  console.log(`📧 Trigger emails by visiting: http://localhost:${PORT}/send`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

// Export for testing
module.exports = { sendDailyEmails };
