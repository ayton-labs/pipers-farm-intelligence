#!/usr/bin/env node
/**
 * CLI script to generate weekly executive summary
 * Usage: node src/cli/generate-weekly-report.js [end-date]
 */

import ExecutiveAgent from '../agents/executive-agent.js';
import NotificationService from '../utils/notification-service.js';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  try {
    console.log('🚀 Generating weekly executive summary...\n');

    // Parse date argument or use today
    const dateArg = process.argv[2];
    const endDate = dateArg ? new Date(dateArg) : new Date();

    console.log(`📅 Week ending: ${endDate.toISOString().split('T')[0]}`);

    // Initialize agent
    const executiveAgent = new ExecutiveAgent();

    // Generate summary
    console.log('📊 Fetching data from all systems (including Klaviyo)...');
    const summary = await executiveAgent.generateWeeklySummary(endDate);

    // Save reports to files
    const outputDir = path.join(process.cwd(), 'outputs', 'weekly');
    await fs.mkdir(outputDir, { recursive: true });

    const dateStr = summary.date;
    const jsonPath = path.join(outputDir, `${dateStr}_summary.json`);
    const markdownPath = path.join(outputDir, `${dateStr}_summary.md`);
    const slackPath = path.join(outputDir, `${dateStr}_slack.txt`);

    // Save JSON
    await fs.writeFile(jsonPath, JSON.stringify(summary, null, 2));
    console.log(`✅ Saved JSON summary: ${jsonPath}`);

    // Save Markdown
    const markdownReport = executiveAgent.formatAsMarkdown(summary);
    await fs.writeFile(markdownPath, markdownReport);
    console.log(`✅ Saved Markdown summary: ${markdownPath}`);

    // Save Slack message
    const slackMessage = executiveAgent.formatAsSlackMessage(summary);
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
        subject: `Piper's Farm Weekly Summary - ${dateStr}`,
        body: markdownReport,
        attachPDF: true,
      });
      console.log('✅ Email sent');
    }

    // Print summary to console
    console.log('\n' + '='.repeat(60));
    console.log(slackMessage);
    console.log('='.repeat(60));

    // Print key insights
    console.log('\n📈 Key Insights:');
    console.log(`   Revenue: £${summary.summary.sales.revenue.toLocaleString()} (${summary.summary.sales.change_percentage >= 0 ? '+' : ''}${summary.summary.sales.change_percentage.toFixed(1)}%)`);
    console.log(`   Margin: ${summary.summary.sales.margin_percentage.toFixed(1)}%`);
    console.log(`   Yield: ${summary.summary.production.yield_percentage.toFixed(1)}%`);
    console.log(`   Campaign CTR: ${summary.summary.marketing.click_rate.toFixed(1)}%`);

    const totalAlerts = summary.alerts.critical.length + summary.alerts.warning.length;
    if (totalAlerts > 0) {
      console.log(`\n⚠️  ${totalAlerts} alert(s) generated`);
      console.log(`   Critical: ${summary.alerts.critical.length}`);
      console.log(`   Warning: ${summary.alerts.warning.length}`);
    }

    console.log('\n✨ Weekly summary generation complete!\n');
  } catch (error) {
    console.error('❌ Error generating weekly summary:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
