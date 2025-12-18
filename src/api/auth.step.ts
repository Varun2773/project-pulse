import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
})

export const config: ApiRouteConfig = {
    type: 'api',
    name: 'AuthLogin',
    description: 'Login endpoint',
    path: '/auth/login',
    method: 'POST',
    emits: [],
    bodySchema: loginSchema,
    responseSchema: {
        200: z.object({
            token: z.string(),
            user: z.object({
                id: z.string(),
                email: z.string(),
                name: z.string().nullable(),
            }),
        }),
        401: z.object({
            error: z.string(),
        }),
    },
}

export const handler: Handlers['AuthLogin'] = async (req, { logger }) => {
    const { email, password } = req.body

    // Find user
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
        // Fallback for demo admin (optional, can remove if desired but helpful for existing session)
        if (email === 'admin@example.com' && password === 'password') {
            return {
                status: 200,
                body: {
                    token: 'demo-token',
                    user: { id: 'admin', email, name: 'Admin' },
                },
            }
        }
        return {
            status: 401,
            body: { error: 'Invalid credentials' },
        }
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
        return {
            status: 401,
            body: { error: 'Invalid credentials' },
        }
    }

    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })

    logger.info(`User logged in: ${email}`)

    return {
        status: 200,
        body: {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        },
    }
}
