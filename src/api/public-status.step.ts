import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const config: ApiRouteConfig = {
    type: 'api',
    name: 'GetPublicStatus',
    description: 'Get public status for a user',
    path: '/api/status/:userId',
    method: 'GET',
    emits: [],
    responseSchema: {
        200: z.object({
            user: z.object({
                name: z.string()
            }),
            services: z.array(z.any()),
            summary: z.object({
                uptime: z.number(), // Mock or calculated
                status: z.string() // 'operational' | 'degraded' | 'outage'
            })
        }),
        404: z.object({
            error: z.string()
        }),
        400: z.object({
            error: z.string()
        })
    }
}

export const handler: Handlers['GetPublicStatus'] = async (req, { logger }) => {
    const { userId } = (req as any).pathParams || {}

    if (!userId) {
        return { status: 400, body: { error: 'Missing user ID' } }
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
    })

    if (!user) {
        return { status: 404, body: { error: 'Status page not found' } }
    }

    const services = await prisma.service.findMany({
        where: { userId },
        select: {
            id: true,
            base_url: true,
            last_status: true,
            last_checked_at: true
        }
    })

    // Calculate Summary
    const total = services.length
    const unhealthy = services.filter(s => s.last_status === 'unhealthy').length
    const degraded = services.filter(s => s.last_status === 'degraded').length

    let overallStatus = 'operational'
    if (unhealthy > 0) overallStatus = 'outage'
    else if (degraded > 0) overallStatus = 'degraded'

    return {
        status: 200,
        body: {
            user: { name: user.name || 'Anonymous' },
            services,
            summary: {
                uptime: 99.9, // Mock for now, calculating real uptime requires incident history analysis
                status: overallStatus
            }
        }
    }
}
