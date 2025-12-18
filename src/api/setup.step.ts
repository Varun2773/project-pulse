import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

export const config: ApiRouteConfig = {
    type: 'api',
    name: 'RegisterService',
    path: '/services',
    method: 'POST',
    emits: [],
    bodySchema: z.object({
        base_url: z.string().url(),
        health_path: z.string().default('/health'),
        alert_email: z.string().email(),
        check_interval: z.number().min(1).default(5),
    }),
    responseSchema: {
        201: z.object({
            id: z.string(),
            message: z.string(),
        }),
        400: z.object({
            error: z.string(),
        }),
        401: z.object({
            error: z.string(),
        }),
    },
}

export const handler: Handlers['RegisterService'] = async (req, { logger }) => {
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

    try {
        const { base_url, health_path, alert_email, check_interval } = req.body

        const service = await prisma.service.create({
            data: {
                base_url,
                health_path,
                alert_email,
                check_interval,
                last_status: 'unknown',
                userId // Link to user
            }
        })

        logger.info('Service registered', { id: service.id, base_url, userId })

        return {
            status: 201,
            body: {
                id: service.id,
                message: 'Service registered successfully',
            },
        }
    } catch (error) {
        logger.error('Failed to register service', { error: String(error) })
        return {
            status: 400,
            body: {
                error: 'Failed to register service',
            },
        }
    }
}
