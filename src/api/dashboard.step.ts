import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const config: ApiRouteConfig = {
    type: 'api',
    name: 'GetDashboardStats',
    description: 'Get dashboard statistics and services',
    path: '/dashboard/stats',
    method: 'GET',
    emits: [],
    responseSchema: {
        200: z.object({
            services: z.array(z.any()),
            incidents: z.array(z.any()),
        }),
    },
}

export const handler: Handlers['GetDashboardStats'] = async (req) => {
    const services = await prisma.service.findMany({
        orderBy: { created_at: 'desc' }
    })

    // Fetch recent incidents (last 50)
    const incidents = await prisma.incident.findMany({
        orderBy: { timestamp: 'desc' },
        take: 50,
        include: {
            service: {
                select: {
                    base_url: true
                }
            }
        }
    })

    return {
        status: 200,
        body: {
            services,
            incidents,
        },
    }
}
