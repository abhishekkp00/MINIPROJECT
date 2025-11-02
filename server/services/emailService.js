/**
 * Email Service
 * Handle sending email notifications using Nodemailer
 */

import nodemailer from 'nodemailer';

/**
 * Create email transporter
 */
const createTransporter = () => {
  // For development, you can use Ethereal (fake SMTP)
  // For production, use your email service (Gmail, SendGrid, etc.)
  
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    console.warn('⚠️  Email service not configured. Emails will not be sent.');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Send email helper function
 * @param {Object} options - Email options
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('📧 Email simulation:', options.subject);
      return { success: false, message: 'Email service not configured' };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Email sending error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to AI Project Management';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1E40AF;">Welcome to AI Project Management! 🎉</h2>
      <p>Hi ${user.name},</p>
      <p>Thank you for joining our platform. We're excited to help you manage your projects with AI-powered insights.</p>
      
      <h3>Getting Started:</h3>
      <ul>
        <li>Create your first project</li>
        <li>Invite team members</li>
        <li>Assign tasks and track progress</li>
        <li>Use AI features for smart suggestions</li>
      </ul>
      
      <p>If you have any questions, feel free to reach out to our support team.</p>
      
      <p>Best regards,<br>The Project Management Team</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: subject,
    html: html,
    text: `Welcome ${user.name}! Thank you for joining AI Project Management.`
  });
};

/**
 * Send task assignment email
 */
export const sendTaskAssignmentEmail = async (task, assignee, assigner) => {
  const subject = `New Task Assigned: ${task.title}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1E40AF;">New Task Assigned 📋</h2>
      <p>Hi ${assignee.name},</p>
      <p><strong>${assigner.name}</strong> has assigned you a new task:</p>
      
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${task.title}</h3>
        <p>${task.description}</p>
        <p><strong>Priority:</strong> <span style="color: ${task.priority === 'high' ? '#DC2626' : '#D97706'};">${task.priority.toUpperCase()}</span></p>
        <p><strong>Deadline:</strong> ${new Date(task.deadline).toLocaleDateString()}</p>
      </div>
      
      <p>Please review and start working on this task as soon as possible.</p>
      
      <a href="${process.env.CLIENT_URL}/tasks/${task._id}" 
         style="display: inline-block; background: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
        View Task
      </a>
    </div>
  `;

  return sendEmail({
    to: assignee.email,
    subject: subject,
    html: html,
    text: `New task assigned: ${task.title}. Priority: ${task.priority}. Deadline: ${new Date(task.deadline).toLocaleDateString()}`
  });
};

/**
 * Send deadline reminder email
 */
export const sendDeadlineReminderEmail = async (task, user) => {
  const deadline = new Date(task.deadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  
  const subject = `Reminder: Task "${task.title}" due ${daysLeft > 0 ? `in ${daysLeft} day(s)` : 'soon'}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #D97706;">⏰ Task Deadline Reminder</h2>
      <p>Hi ${user.name},</p>
      <p>This is a reminder that your task is due ${daysLeft > 0 ? `in ${daysLeft} day(s)` : 'very soon'}:</p>
      
      <div style="background: #FEF3C7; padding: 15px; border-left: 4px solid #D97706; margin: 20px 0;">
        <h3 style="margin-top: 0;">${task.title}</h3>
        <p><strong>Deadline:</strong> ${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString()}</p>
        <p><strong>Status:</strong> ${task.status}</p>
        <p><strong>Progress:</strong> ${task.progress}%</p>
      </div>
      
      <p>Please ensure the task is completed on time.</p>
      
      <a href="${process.env.CLIENT_URL}/tasks/${task._id}" 
         style="display: inline-block; background: #D97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
        View Task
      </a>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: subject,
    html: html,
    text: `Reminder: Task "${task.title}" is due ${daysLeft > 0 ? `in ${daysLeft} days` : 'soon'}.`
  });
};

/**
 * Send mentor feedback email
 */
export const sendMentorFeedbackEmail = async (task, student, mentor, feedback) => {
  const subject = `Mentor Feedback on: ${task.title}`;
  
  const statusColors = {
    approved: '#16A34A',
    rejected: '#DC2626',
    'revision-required': '#D97706'
  };
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1E40AF;">📝 Mentor Feedback Received</h2>
      <p>Hi ${student.name},</p>
      <p><strong>${mentor.name}</strong> has reviewed your task:</p>
      
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${task.title}</h3>
        <p><strong>Status:</strong> <span style="color: ${statusColors[feedback.status]};">${feedback.status.toUpperCase()}</span></p>
        ${feedback.rating ? `<p><strong>Rating:</strong> ${'⭐'.repeat(feedback.rating)}</p>` : ''}
        
        <div style="margin-top: 15px; padding: 10px; background: white; border-radius: 4px;">
          <strong>Feedback:</strong>
          <p>${feedback.feedback}</p>
        </div>
      </div>
      
      <a href="${process.env.CLIENT_URL}/tasks/${task._id}" 
         style="display: inline-block; background: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
        View Task & Feedback
      </a>
    </div>
  `;

  return sendEmail({
    to: student.email,
    subject: subject,
    html: html,
    text: `Mentor ${mentor.name} has reviewed your task "${task.title}". Status: ${feedback.status}. ${feedback.feedback}`
  });
};

/**
 * Send project invitation email
 */
export const sendProjectInvitationEmail = async (project, newMember, inviter) => {
  const subject = `Invitation: Join "${project.title}" Project`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1E40AF;">🎯 Project Invitation</h2>
      <p>Hi ${newMember.name},</p>
      <p><strong>${inviter.name}</strong> has invited you to join the project:</p>
      
      <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1E40AF;">${project.title}</h3>
        <p>${project.description}</p>
        <p><strong>Deadline:</strong> ${new Date(project.deadline).toLocaleDateString()}</p>
        <p><strong>Team Members:</strong> ${project.members.length}</p>
      </div>
      
      <p>Click the button below to view the project and start collaborating:</p>
      
      <a href="${process.env.CLIENT_URL}/projects/${project._id}" 
         style="display: inline-block; background: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
        View Project
      </a>
    </div>
  `;

  return sendEmail({
    to: newMember.email,
    subject: subject,
    html: html,
    text: `${inviter.name} has invited you to join the project "${project.title}".`
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  const subject = 'Password Reset Request';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1E40AF;">🔐 Password Reset Request</h2>
      <p>Hi ${user.name},</p>
      <p>You requested to reset your password. Click the button below to create a new password:</p>
      
      <a href="${resetUrl}" 
         style="display: inline-block; background: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Reset Password
      </a>
      
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      
      <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
        If the button doesn't work, copy and paste this URL into your browser:<br>
        ${resetUrl}
      </p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: subject,
    html: html,
    text: `Password reset requested. Use this link to reset: ${resetUrl}`
  });
};

/**
 * Send project completion email
 */
export const sendProjectCompletionEmail = async (project, member) => {
  const subject = `Project Completed: ${project.title} 🎉`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16A34A;">🎉 Project Completed!</h2>
      <p>Hi ${member.name},</p>
      <p>Congratulations! The project <strong>${project.title}</strong> has been successfully completed!</p>
      
      <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16A34A;">
        <h3 style="margin-top: 0;">${project.title}</h3>
        <p><strong>Completed on:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Total Tasks:</strong> ${project.stats.totalTasks}</p>
        <p><strong>Team Members:</strong> ${project.members.length}</p>
      </div>
      
      <p>Thank you for your contribution to this project's success!</p>
      
      <a href="${process.env.CLIENT_URL}/projects/${project._id}" 
         style="display: inline-block; background: #16A34A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
        View Project Summary
      </a>
    </div>
  `;

  return sendEmail({
    to: member.email,
    subject: subject,
    html: html,
    text: `Congratulations! Project "${project.title}" has been completed successfully.`
  });
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendTaskAssignmentEmail,
  sendDeadlineReminderEmail,
  sendMentorFeedbackEmail,
  sendProjectInvitationEmail,
  sendPasswordResetEmail,
  sendProjectCompletionEmail
};
