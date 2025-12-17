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

            await transporter.sendMail({
                from: process.env.EMAIL_FROM_ADDRESS,
                to: alertEmail,
                subject,
                text
            })
            logger.info('Email sent successfully via Nodemailer')
        } catch (e) {
            logger.error('Failed to send email', { error: String(e) })
        }
    } else {
        logger.warn('Skipping email. Missing EMAIL_PROVIDER_API_KEY, EMAIL_FROM_ADDRESS or alertEmail.')
    }
}
