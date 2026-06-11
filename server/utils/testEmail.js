/**
 * Email Test Script
 * Run: node server/utils/testEmail.js
 * This will test if your SMTP settings work correctly
 */

const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const nodemailer = require('nodemailer');

const testEmail = async () => {
  console.log('\n📧 SmartInventory Email Test');
  console.log('═══════════════════════════════════════════');

  const email = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;

  // Check config
  if (!email || email === 'your_email@gmail.com') {
    console.log('❌ SMTP_EMAIL is not set in .env file');
    console.log('   Set it to your Gmail address');
    process.exit(1);
  }

  if (!pass || pass === 'your_16_char_app_password_here' || pass.length < 10) {
    console.log('❌ SMTP_PASSWORD is not set or still placeholder');
    console.log('   You need a Gmail App Password (16 characters)');
    console.log('');
    console.log('   HOW TO GET IT:');
    console.log('   1. Go to: https://myaccount.google.com/apppasswords');
    console.log('   2. Sign in with:', email);
    console.log('   3. Select App: Mail → Device: Windows Computer');
    console.log('   4. Click Generate → Copy the 16-char password');
    console.log('   5. Open .env file and set: SMTP_PASSWORD=yourpassword');
    process.exit(1);
  }

  console.log('✅ SMTP_EMAIL:', email);
  console.log('✅ SMTP_PASSWORD: ' + '*'.repeat(pass.length) + ' (set)');
  console.log('');
  console.log('Testing connection to', process.env.SMTP_HOST || 'smtp.ethereal.email', '...');

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: email, pass: pass },
      tls: { rejectUnauthorized: false },
    });

    await transporter.verify();
    console.log('✅ SMTP Connection: SUCCESS!');
    console.log('');
    console.log('Sending test email to:', email);

    const info = await transporter.sendMail({
      from: `SmartInventory Pro <${email}>`,
      to: email,
      subject: '✅ SmartInventory Email Test — Working!',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;background:#f8fafc;border-radius:12px;">
          <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:24px;border-radius:10px;text-align:center;margin-bottom:20px;">
            <h1 style="color:#fff;margin:0;font-size:22px;">✅ Email Test Successful!</h1>
          </div>
          <div style="background:#fff;padding:20px;border-radius:10px;">
            <p style="color:#4a5568;">Your SmartInventory email system is working correctly!</p>
            <p style="color:#718096;font-size:14px;">You can now send:</p>
            <ul style="color:#718096;font-size:14px;line-height:1.8;">
              <li>🧾 Invoice / Bill emails to customers</li>
              <li>✅ Payment confirmation emails</li>
              <li>⏰ Payment reminder emails</li>
              <li>⚠️ Low stock alert emails</li>
            </ul>
          </div>
          <p style="text-align:center;color:#a0aec0;font-size:12px;margin-top:16px;">SmartInventory Pro — Test Email</p>
        </div>
      `,
    });

    console.log('✅ Test email sent! Message ID:', info.messageId);
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('🎉 Email is working! Check your inbox:', email);
    console.log('═══════════════════════════════════════════');

  } catch (error) {
    console.log('❌ Email test FAILED!');
    console.log('');
    console.log('Error:', error.message);
    console.log('');

    if (error.message.includes('535') || error.message.includes('Username and Password')) {
      console.log('🔑 FIX: Wrong App Password');
      console.log('   Your Gmail App Password is incorrect.');
      console.log('   Steps to fix:');
      console.log('   1. Go to: https://myaccount.google.com/apppasswords');
      console.log('   2. Delete old app password if exists');
      console.log('   3. Create new one: Mail → Windows Computer → Generate');
      console.log('   4. Copy the NEW 16-character password (no spaces)');
      console.log('   5. Update .env: SMTP_PASSWORD=newpasswordhere');
      console.log('   6. Run this test again: node server/utils/testEmail.js');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      console.log('🌐 FIX: Network/Firewall issue');
      console.log('   Cannot reach smtp.gmail.com:587');
      console.log('   Try: Check your internet connection or firewall settings');
    } else if (error.message.includes('less secure') || error.message.includes('EAUTH')) {
      console.log('🔒 FIX: Enable App Passwords in Gmail');
      console.log('   1. Go to: https://myaccount.google.com/security');
      console.log('   2. Enable 2-Step Verification first');
      console.log('   3. Then go to App Passwords and generate one');
    }
  }
};

testEmail();
