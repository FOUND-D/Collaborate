const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const asyncHandler = require('../middleware/asyncHandler');
const { supabase } = require('../lib/repo');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email ? email.trim().toLowerCase() : '';

  if (!normalizedEmail) {
    return res.status(400).json({ message: 'Please provide an email' });
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (userError) throw userError;

  // Security: Always return success even if user not found
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) throw tokenError;

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"Collaborate Support" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: 'Reset your Collaborate password',
      text: `Hi ${user.name},\n\nClick this link to reset your password (valid for 1 hour):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
      html: `<p>Hi ${user.name},</p><p>Click this link to reset your password (valid for 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, ignore this email.</p>`,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (err) {
      console.error('Email sending failed:', err);
      // We don't want to throw here to avoid revealing user existence, 
      // but in a real app you might want more robust logging/handling.
    }
  }

  res.json({ message: 'If this email is registered you will receive a reset link' });
});

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Invalid request data' });
  }

  const { data: resetRow, error: resetError } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (resetError) throw resetError;
  if (!resetRow) {
    return res.status(400).json({ message: 'Reset link is invalid or has expired' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', resetRow.user_id);

  if (updateError) throw updateError;

  const { error: markUsedError } = await supabase
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('id', resetRow.id);

  if (markUsedError) throw markUsedError;

  res.json({ message: 'Password reset successfully' });
});

module.exports = {
  forgotPassword,
  resetPassword,
};
