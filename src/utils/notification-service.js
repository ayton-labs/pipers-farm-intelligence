/**
 * Notification Service
 * Handles sending notifications via Slack and Email
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class NotificationService {
  constructor() {
    this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.emailConfig = {
      host: process.env.EMAIL_SMTP_HOST,
      port: process.env.EMAIL_SMTP_PORT || 587,
      from: process.env.EMAIL_FROM,
      password: process.env.EMAIL_PASSWORD,
    };
  }

  /**
   * Send message to Slack
   * @param {string} message - Message text
   * @param {string} channel - Slack channel (optional)
   * @returns {Promise<void>}
   */
  async sendSlackMessage(message, channel = null) {
    if (!this.slackWebhookUrl) {
      console.warn('⚠️  Slack webhook URL not configured, skipping Slack notification');
      return;
    }

    try {
      const payload = {
        text: message,
        mrkdwn: true,
      };

      if (channel) {
        payload.channel = channel;
      }

      await axios.post(this.slackWebhookUrl, payload);
    } catch (error) {
      console.error('Error sending Slack message:', error.message);
      throw error;
    }
  }

  /**
   * Send Slack message with blocks (rich formatting)
   * @param {Array} blocks - Slack blocks
   * @param {string} channel - Slack channel
   * @returns {Promise<void>}
   */
  async sendSlackBlocks(blocks, channel = null) {
    if (!this.slackWebhookUrl) {
      console.warn('⚠️  Slack webhook URL not configured, skipping Slack notification');
      return;
    }

    try {
      const payload = {
        blocks,
      };

      if (channel) {
        payload.channel = channel;
      }

      await axios.post(this.slackWebhookUrl, payload);
    } catch (error) {
      console.error('Error sending Slack blocks:', error.message);
      throw error;
    }
  }

  /**
   * Send email notification
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.body - Email body (markdown)
   * @param {boolean} options.attachPDF - Whether to attach PDF
   * @returns {Promise<void>}
   */
  async sendEmail({ to, subject, body, attachPDF = false }) {
    if (!this.emailConfig.host) {
      console.warn('⚠️  Email SMTP not configured, skipping email notification');
      return;
    }

    // NOTE: This is a simplified implementation
    // In production, use a library like nodemailer
    try {
      console.log(`📧 Email would be sent to: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   (Email sending requires nodemailer - see docs/SETUP.md)`);

      // TODO: Implement with nodemailer
      // const transporter = nodemailer.createTransport({...});
      // await transporter.sendMail({...});
    } catch (error) {
      console.error('Error sending email:', error.message);
      throw error;
    }
  }

  /**
   * Send departmental report to specific Slack channel
   * @param {string} department - Department name (ops, finance, marketing)
   * @param {string} message - Report message
   * @returns {Promise<void>}
   */
  async sendDepartmentReport(department, message) {
    const channelMap = {
      ops: process.env.SLACK_CHANNEL_OPS,
      finance: process.env.SLACK_CHANNEL_FINANCE,
      marketing: process.env.SLACK_CHANNEL_MARKETING,
    };

    const channel = channelMap[department];
    if (!channel) {
      console.warn(`⚠️  No Slack channel configured for department: ${department}`);
      return;
    }

    await this.sendSlackMessage(message, channel);
  }

  /**
   * Send alert notification
   * @param {Object} alert - Alert object
   * @param {string} alert.type - Alert type
   * @param {string} alert.message - Alert message
   * @param {string} alert.severity - Alert severity
   * @returns {Promise<void>}
   */
  async sendAlert(alert) {
    const emoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';
    const message = `${emoji} *[${alert.severity.toUpperCase()}]* ${alert.message}`;

    // Send to executive channel for critical alerts
    if (alert.severity === 'critical') {
      await this.sendSlackMessage(message, process.env.SLACK_CHANNEL_EXECUTIVE);
    }
  }
}

export default NotificationService;
