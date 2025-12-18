import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

export const config: ApiRouteConfig = {
    type: 'api',
    name: 'DeleteService',
    description: 'Deletes a service',
    path: '/services/:id',
    method: 'DELETE',
    emits: [],
    responseSchema: {
        200: z.object({ message: z.string() }),
        401: z.object({ error: z.string() }),
        404: z.object({ error: z.string() })
    }
}

export const handler: Handlers['DeleteService'] = async (req, { logger }) => {
    const { id } = req.params as { id: string }
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

    const service = await prisma.service.findUnique({ where: { id } })

    if (!service) {
        return { status: 404, body: { error: 'Service not found' } }
    }

    if (service.userId !== userId) {
        return { status: 401, body: { error: 'Unauthorized to delete this service' } }
    }

    // Delete related incidents first (cascade typically handles this but safe to be explicit or rely on schema)
    // Here relying on schema relation or just deleting service if CASCADE configured.
    // Prisma default relation might fail if incidents exist, let's delete incidents first to be safe.
    await prisma.incident.deleteMany({ where: { service_id: id } })
    await prisma.service.delete({ where: { id } })

    logger.info(`Service deleted: ${id} by user ${userId}`)

    return {
        status: 200,
        body: { message: 'Service deleted' }
    }
}
