import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

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
        401: z.object({
            error: z.string()
        })
    },
}

export const handler: Handlers['GetDashboardStats'] = async (req) => {
    const authHeader = req.headers['authorization']
    if (!authHeader || typeof authHeader !== 'string') {
        return { status: 401, body: { error: 'Unauthorized' } }
    }

    const token = authHeader.split(' ')[1]
    let userId: string

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
        userId = decoded.userId
    } catch (e) {
        return { status: 401, body: { error: 'Invalid token' } }
    }

    const services = await prisma.service.findMany({
        where: { userId },
        orderBy: { created_at: 'desc' }
    })

    // Fetch recent incidents (last 50) for user's services
    const incidents = await prisma.incident.findMany({
        where: {
            service: { userId }
        },
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
            userId
        },
    }
}
