import { CronConfig, Handlers } from 'motia'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const config: CronConfig = {
    type: 'cron',
    name: 'HealthCheckMonitor',
    description: 'Periodically triggers health checks for all services',
    cron: '* * * * *', // Every minute
    emits: ['trigger-check'],
    flows: ['ServiceHealthCheckWorkflow'],
}

export const handler: Handlers['HealthCheckMonitor'] = async ({ emit, logger }) => {
    logger.info('Starting scheduled health check monitor')

    const services = await prisma.service.findMany()

    if (!services.length) {
        logger.info('No services registered to check')
        return
    }

    const now = new Date()
    const dueServices = services.filter(service => {
        if (!service.last_checked_at) return true
        const nextCheck = new Date(service.last_checked_at.getTime() + service.check_interval * 60 * 1000)
        return now >= nextCheck
    })

    if (!dueServices.length) {
        logger.info('No services due for check')
        return
    }

    logger.info(`Triggering checks for ${dueServices.length} services`)

    // Update last_checked_at immediately to prevent duplicate checks
    await prisma.service.updateMany({
        where: {
            id: { in: dueServices.map(s => s.id) }
        },
        data: {
            last_checked_at: now
        }
    })

    for (const service of dueServices) {
        await emit({
            topic: 'trigger-check',
            data: {
                serviceId: service.id,
                baseUrl: service.base_url,
                healthPath: service.health_path
            }
        })
    }
}
