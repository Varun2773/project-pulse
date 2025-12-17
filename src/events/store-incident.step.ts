import { EventConfig, Handlers } from 'motia'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const inputSchema = z.object({
    serviceId: z.string(),
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    reason: z.string(),
    errorCode: z.string().nullable(),
    latency: z.number()
})

export const config: EventConfig = {
    type: 'event',
    name: 'StoreIncident',
    description: 'Stores incident and updates service status',
    subscribes: ['store-incident'],
    emits: ['notify-alert'],
    input: inputSchema,
    flows: ['ServiceHealthCheckWorkflow'],
}

export const handler: Handlers['StoreIncident'] = async (input, { emit, logger }) => {
    const { serviceId, status, reason, errorCode, latency } = input

    const service = await prisma.service.findUnique({ where: { id: serviceId } })

    if (!service) {
        logger.error(`Service ${serviceId} not found`)
        return
    }

    const previousStatus = service.last_status

    // Update service status and create incident if needed
    // We'll treat every state change or unhealthy status as worthy of recording/updating
    const isTransition = previousStatus !== status
    const isUnhealthy = status === 'unhealthy'
    const isRecovery = previousStatus === 'unhealthy' && status === 'healthy'

    await prisma.service.update({
        where: { id: serviceId },
        data: { last_status: status }
    })

    // Log incident if status changed or is currently unhealthy/degraded
    if (isTransition || isUnhealthy || status === 'degraded') {
        const incident = await prisma.incident.create({
            data: {
                service_id: serviceId,
                status,
                reason,
                error_code: errorCode as string | null,
                latency,
                timestamp: new Date()
            }
        })

        if (isUnhealthy || isRecovery) {
            // Throttling logic for unhealthy alerts
            if (isUnhealthy) {
                const now = new Date()
                if (service.last_alert_sent_at) {
                    const timeSinceLastAlert = now.getTime() - service.last_alert_sent_at.getTime()
                    if (timeSinceLastAlert < 30 * 60 * 1000) {
                        logger.info(`Skipping alert for service ${serviceId}: Alert sent recently`)
                        return
                    }
                }

                // Update last_alert_sent_at
                await prisma.service.update({
                    where: { id: serviceId },
                    data: { last_alert_sent_at: now }
                })
            }

            await (emit as any)({
                topic: 'notify-alert',
                data: {
                    serviceId,
                    status,
                    reason,
                    latency,
                    timestamp: incident.timestamp.toISOString(),
                    alertEmail: service.alert_email as string
                }
            })
        }
    }
}
