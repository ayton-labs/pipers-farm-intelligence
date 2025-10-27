#!/usr/bin/env node
/**
 * CLI script to generate daily executive digest
 * Usage: node src/cli/generate-daily-report.js [date]
 */

import ExecutiveAgent from '../agents/executive-agent.js';
import NotificationService from '../utils/notification-service.js';
import { subDays } from 'date-fns';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  try {
    console.log('🚀 Generating daily executive digest...\n');

    // Parse date argument or use yesterday
    const dateArg = process.argv[2];
    const reportDate = dateArg ? new Date(dateArg) : subDays(new Date(), 1);

    console.log(`📅 Report date: ${reportDate.toISOString().split('T')[0]}`);

    // Initialize agent
    const executiveAgent = new ExecutiveAgent();

    // Generate digest
    console.log('📊 Fetching data from all systems...');
    const digest = await executiveAgent.generateDailyDigest(reportDate);

    // Save reports to files
    const outputDir = path.join(process.cwd(), 'outputs', 'daily');
    await fs.mkdir(outputDir, { recursive: true });

    const dateStr = digest.date;
    const jsonPath = path.join(outputDir, `${dateStr}_digest.json`);
    const markdownPath = path.join(outputDir, `${dateStr}_digest.md`);
    const slackPath = path.join(outputDir, `${dateStr}_slack.txt`);

    // Save JSON
    await fs.writeFile(jsonPath, JSON.stringify(digest, null, 2));
    console.log(`✅ Saved JSON report: ${jsonPath}`);

    // Save Markdown
    const markdownReport = executiveAgent.formatAsMarkdown(digest);
    await fs.writeFile(markdownPath, markdownReport);
    console.log(`✅ Saved Markdown report: ${markdownPath}`);

    // Save Slack message
    const slackMessage = executiveAgent.formatAsSlackMessage(digest);
    await fs.writeFile(slackPath, slackMessage);
    console.log(`✅ Saved Slack message: ${slackPath}`);

    // Send notifications
    const notificationService = new NotificationService();

    if (process.env.SLACK_WEBHOOK_URL) {
      console.log('\n📨 Sending Slack notification...');
      await notificationService.sendSlackMessage(slackMessage, process.env.SLACK_CHANNEL_EXECUTIVE);
      console.log('✅ Slack notification sent');
    }

    if (process.env.EMAIL_SMTP_HOST && process.env.EMAIL_TO_EXECUTIVE) {
      console.log('\n📧 Sending email notification...');
      await notificationService.sendEmail({
        to: process.env.EMAIL_TO_EXECUTIVE,
        subject: `Piper's Farm Daily Report - ${dateStr}`,
        body: markdownReport,
      });
      console.log('✅ Email sent');
    }

    // Print summary to console
    console.log('\n' + '='.repeat(60));
    console.log(slackMessage);
    console.log('='.repeat(60));

    // Print alerts if any
    const totalAlerts = digest.alerts.critical.length + digest.alerts.warning.length;
    if (totalAlerts > 0) {
      console.log(`\n⚠️  ${totalAlerts} alert(s) generated`);
      console.log(`   Critical: ${digest.alerts.critical.length}`);
      console.log(`   Warning: ${digest.alerts.warning.length}`);
    }

    console.log('\n✨ Daily report generation complete!\n');
  } catch (error) {
    console.error('❌ Error generating daily report:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
