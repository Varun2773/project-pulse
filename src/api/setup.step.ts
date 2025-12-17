import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
    },
}

export const handler: Handlers['RegisterService'] = async (req, { logger }) => {
    try {
        const { base_url, health_path, alert_email, check_interval } = req.body

        // Using Prisma instead of Motia State
        // const { default: prisma } = await import('../db') // Removed dynamic import

        const service = await prisma.service.create({
            data: {
                base_url,
                health_path,
                alert_email,
                check_interval,
                last_status: 'unknown'
            }
        })

        logger.info('Service registered', { id: service.id, base_url })

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
