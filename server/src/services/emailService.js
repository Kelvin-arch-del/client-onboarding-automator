const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const Bull = require('bull');
const Redis = require('redis');
const EmailLog = require('../models/EmailLog');
const config = require('../config/email');

// TODO: Configure Redis connection for production
const redis = Redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
});

// Create Bull queue for email processing
const emailQueue = new Bull('email processing', {
    redis: {
        port: process.env.REDIS_PORT || 6379,
        host: process.env.REDIS_HOST || 'localhost',
        password: process.env.REDIS_PASSWORD
    }
});

// Configure nodemailer transporter
const transporter = nodemailer.createTransporter({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
        user: config.smtp.user,
        pass: config.smtp.password
    }
});

class EmailService {
    constructor() {
        this.templatesPath = path.join(__dirname, '../templates/emails');
        this.compiledTemplates = new Map();
        this.setupQueueProcessor();
    }

    /**
     * Set up Bull queue processor for email jobs
     */
    setupQueueProcessor() {
        emailQueue.process('sendEmail', async (job) => {
            const { emailData } = job.data;
            try {
                await this.sendEmailDirectly(emailData);
                return { success: true, messageId: emailData.messageId };
            } catch (error) {
                // Log failure and update email log
                await EmailLog.findByIdAndUpdate(emailData.logId, {
                    status: 'failed',
                    failureReason: error.message,
                    lastAttemptAt: new Date()
                });
                throw error;
            }
        });

        // Handle failed jobs with retry logic
        emailQueue.on('failed', (job, err) => {
            console.error(`Email job ${job.id} failed:`, err.message);
            // TODO: Implement exponential backoff retry logic
        });

        emailQueue.on('completed', (job, result) => {
            console.log(`Email job ${job.id} completed successfully`);
        });
    }

    /**
     * Load and compile Handlebars template
     */
    async loadTemplate(templateName) {
        if (this.compiledTemplates.has(templateName)) {
            return this.compiledTemplates.get(templateName);
        }

        const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);
        try {
            const templateSource = await fs.readFile(templatePath, 'utf8');
            const compiled = handlebars.compile(templateSource);
            this.compiledTemplates.set(templateName, compiled);
            return compiled;
        } catch (error) {
            throw new Error(`Failed to load template ${templateName}: ${error.message}`);
        }
    }

    /**
     * Queue email for processing
     */
    async queueEmail(templateType, clientData, options = {}) {
        try {
            // Create email log entry
            const emailLog = new EmailLog({
                clientId: clientData.clientId,
                templateType,
                recipient: clientData.email,
                subject: this.getSubjectForTemplate(templateType, clientData),
                status: 'queued',
                metadata: options.metadata || {}
            });
            await emailLog.save();

            // Prepare email data
            const emailData = {
                logId: emailLog._id,
                templateType,
                recipient: clientData.email,
                subject: emailLog.subject,
                templateData: {
                    ...clientData,
                    unsubscribeLink: `${process.env.BASE_URL}/unsubscribe?token=${this.generateUnsubscribeToken(clientData.clientId)}`,
                    companyName: process.env.COMPANY_NAME || 'Legal Services',
                    companyAddress: process.env.COMPANY_ADDRESS,
                    contactEmail: process.env.CONTACT_EMAIL,
                    contactPhone: process.env.CONTACT_PHONE,
                    clientPortalUrl: `${process.env.BASE_URL}/client-portal`
                }
            };

            // Add to queue with priority and delay options
            const jobOptions = {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 60000 // 1 minute
                },
                delay: options.delay || 0,
                priority: options.priority || 0
            };

            const job = await emailQueue.add('sendEmail', { emailData }, jobOptions);
            
            console.log(`Email queued for processing: Job ID ${job.id}`);
            return { success: true, jobId: job.id, logId: emailLog._id };
        } catch (error) {
            console.error('Failed to queue email:', error);
            throw error;
        }
    }

    /**
     * Send email directly (used by queue processor)
     */
    async sendEmailDirectly(emailData) {
        const template = await this.loadTemplate(emailData.templateType);
        const htmlContent = template(emailData.templateData);

        const mailOptions = {
            from: config.from,
            to: emailData.recipient,
            subject: emailData.subject,
            html: htmlContent,
            // Add unsubscribe headers for compliance
            headers: {
                'List-Unsubscribe': `<${emailData.templateData.unsubscribeLink}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
            }
        };

        const result = await transporter.sendMail(mailOptions);
        
        // Update email log with sent status
        await EmailLog.findByIdAndUpdate(emailData.logId, {
            status: 'sent',
            messageId: result.messageId,
            lastAttemptAt: new Date()
        });

        return result;
    }

    /**
     * Send welcome email to new client
     */
    async sendWelcomeEmail(clientData, options = {}) {
        return await this.queueEmail('welcome', clientData, options);
    }

    /**
     * Send document request email
     */
    async sendDocumentRequestEmail(clientData, documentDetails, options = {}) {
        const enhancedClientData = {
            ...clientData,
            documentDetails,
            requestedDocuments: documentDetails.documents || []
        };
        return await this.queueEmail('documentRequest', enhancedClientData, options);
    }

    /**
     * Send reminder email
     */
    async sendReminderEmail(clientData, reminderDetails, options = {}) {
        const enhancedClientData = {
            ...clientData,
            ...reminderDetails
        };
        return await this.queueEmail('reminder', enhancedClientData, options);
    }

    /**
     * Send completion email
     */
    async sendCompletionEmail(clientData, completionDetails, options = {}) {
        const enhancedClientData = {
            ...clientData,
            ...completionDetails
        };
        return await this.queueEmail('completion', enhancedClientData, options);
    }

    /**
     * Handle delivery status webhooks
     */
    async handleDeliveryWebhook(webhookData) {
        try {
            const { messageId, status, timestamp } = webhookData;
            
            const updateData = {
                status: this.mapWebhookStatus(status),
                lastAttemptAt: new Date(timestamp)
            };

            if (status === 'delivered') {
                updateData.deliveredAt = new Date(timestamp);
            } else if (status === 'failed' || status === 'bounced') {
                updateData.failureReason = webhookData.reason || 'Delivery failed';
            }

            await EmailLog.updateStatus(messageId, updateData.status, updateData);
            console.log(`Email status updated: ${messageId} -> ${status}`);
        } catch (error) {
            console.error('Failed to handle delivery webhook:', error);
        }
    }

    /**
     * Get email statistics
     */
    async getEmailStats(filters = {}) {
        const matchConditions = {};
        
        if (filters.clientId) matchConditions.clientId = filters.clientId;
        if (filters.templateType) matchConditions.templateType = filters.templateType;
        if (filters.startDate || filters.endDate) {
            matchConditions.createdAt = {};
            if (filters.startDate) matchConditions.createdAt.$gte = new Date(filters.startDate);
            if (filters.endDate) matchConditions.createdAt.$lte = new Date(filters.endDate);
        }

        const stats = await EmailLog.aggregate([
            { $match: matchConditions },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    avgDeliveryTime: {
                        $avg: {
                            $cond: {
                                if: { $eq: ['$status', 'delivered'] },
                                then: { $subtract: ['$deliveredAt', '$createdAt'] },
                                else: null
                            }
                        }
                    }
                }
            }
        ]);

        return stats.reduce((acc, stat) => {
            acc[stat._id] = {
                count: stat.count,
                avgDeliveryTime: stat.avgDeliveryTime
            };
            return acc;
        }, {});
    }

    /**
     * Generate unsubscribe token
     */
    generateUnsubscribeToken(clientId) {
        const crypto = require('crypto');
        const payload = JSON.stringify({ clientId, timestamp: Date.now() });
        return crypto.createHash('sha256')
            .update(payload + process.env.UNSUBSCRIBE_SECRET)
            .digest('hex');
    }

    /**
     * Get subject line for template type
     */
    getSubjectForTemplate(templateType, clientData) {
        const subjects = {
            welcome: `Welcome to ${process.env.COMPANY_NAME || 'Legal Services'} - Case #${clientData.caseId}`,
            documentRequest: `Document Request - Case #${clientData.caseId}`,
            reminder: `Reminder: Action Required - Case #${clientData.caseId}`,
            completion: `Case Completed - Case #${clientData.caseId}`
        };
        return subjects[templateType] || 'Update from Legal Services';
    }

    /**
     * Map webhook status to internal status
     */
    mapWebhookStatus(webhookStatus) {
        const statusMap = {
            'delivered': 'delivered',
            'bounced': 'bounced',
            'failed': 'failed',
            'complained': 'failed'
        };
        return statusMap[webhookStatus] || 'failed';
    }

    /**
     * Clean up old email logs (run periodically)
     */
    async cleanupOldLogs(olderThanDays = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        
        const result = await EmailLog.deleteMany({
            createdAt: { $lt: cutoffDate },
            status: { $in: ['delivered', 'failed'] }
        });
        
        console.log(`Cleaned up ${result.deletedCount} old email logs`);
        return result.deletedCount;
    }

    /**
     * Get queue status and metrics
     */
    async getQueueStatus() {
        const waiting = await emailQueue.getWaiting();
        const active = await emailQueue.getActive();
        const completed = await emailQueue.getCompleted();
        const failed = await emailQueue.getFailed();

        return {
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length,
            total: waiting.length + active.length + completed.length + failed.length
        };
    }
}

// TODO: Add comprehensive error handling and logging
// TODO: Implement rate limiting for email sending
// TODO: Add email template validation
// TODO: Implement A/B testing for email templates
// TODO: Add analytics and click tracking
// TODO: Implement bounce handling and automatic list cleaning
// TODO: Add support for email attachments
// TODO: Implement email template previewing functionality

module.exports = new EmailService();