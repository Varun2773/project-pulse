import { EventConfig, Handlers } from 'motia'
import { z } from 'zod'

const inputSchema = z.object({
    serviceId: z.string(),
    status: z.string(),
    reason: z.string(),
    latency: z.number(),
    timestamp: z.string(),
    alertEmail: z.string().email().optional()
})

export const config: EventConfig = {
    type: 'event',
    name: 'NotifyAlert',
    description: 'Sends alert notifications',
    subscribes: ['notify-alert'],
    emits: [],
    input: inputSchema,
    flows: ['ServiceHealthCheckWorkflow']
}

export const handler: Handlers['NotifyAlert'] = async (input, { logger }) => {
    const { serviceId, status, reason, latency, timestamp, alertEmail } = input

    const subject = `[ProjectPulse] Service ${status.toUpperCase()} - Alert`
    const text = `
    Service ID: ${serviceId}
    Status: ${status.toUpperCase()}
    Reason: ${reason}
    Latency: ${latency}ms
    Timestamp: ${timestamp}
  `

    logger.info(`[ALERT] Sending notification to ${alertEmail || 'admin'}`)
    logger.info(text)

    if (process.env.EMAIL_PROVIDER_API_KEY && process.env.EMAIL_FROM_ADDRESS && alertEmail) {
        try {
            const nodemailer = await import('nodemailer')
            // Example using Gmail or generic SMTP, configured via environment variables
            // In a real scenario, you'd use SendGrid, Mailgun etc.
            // Here we assume a simple SMTP setup or use a test account if no env vars.

            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false,
                auth: {
                    user: process.env.EMAIL_FROM_ADDRESS,
                    pass: process.env.EMAIL_PROVIDER_API_KEY
                }
            })

            const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 8px; }
                    .header { background: ${status === 'unhealthy' ? '#ef4444' : '#10b981'}; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; color: white; }
                    .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                    .metric { margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                    .label { font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; }
                    .value { font-size: 18px; font-weight: 600; margin-top: 4px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af; }
                    .button { display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin:0; font-size: 24px;">Service Alert</h1>
                        <p style="margin:5px 0 0; opacity: 0.9;">${status.toUpperCase()}</p>
                    </div>
                    <div class="content">
                        <div class="metric">
                            <div class="label">Service ID</div>
                            <div class="value" style="font-family: monospace;">${serviceId}</div>
                        </div>
                        <div class="metric">
                            <div class="label">Issue</div>
                            <div class="value">${reason}</div>
                        </div>
                        <div class="metric">
                            <div class="label">Latency</div>
                            <div class="value">${latency}ms</div>
                        </div>
                        <div class="metric">
                            <div class="label">Time</div>
                            <div class="value">${new Date(timestamp).toLocaleString()}</div>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="http://localhost:5173" class="button">View Dashboard</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Sent by Project Pulse Monitoring</p>
                    </div>
                </div>
            </body>
            </html>
            `

            await transporter.sendMail({
                from: process.env.EMAIL_FROM_ADDRESS,
                to: alertEmail,
                subject,
                text, // Fallback for clients that don't render HTML
                html
            })
            logger.info('Email sent successfully via Nodemailer')
        } catch (e) {
            logger.error('Failed to send email', { error: String(e) })
        }
    } else {
        logger.warn('Skipping email. Missing EMAIL_PROVIDER_API_KEY, EMAIL_FROM_ADDRESS or alertEmail.')
    }
}
