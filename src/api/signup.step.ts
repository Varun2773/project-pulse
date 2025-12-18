import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
})

export const config: ApiRouteConfig = {
    type: 'api',
    name: 'AuthSignup',
    description: 'Signup endpoint',
    path: '/auth/signup',
    method: 'POST',
    emits: [],
    bodySchema: signupSchema,
    responseSchema: {
        201: z.object({
            token: z.string(),
            user: z.object({
                id: z.string(),
                email: z.string(),
                name: z.string().nullable(),
            }),
        }),
        400: z.object({
            error: z.string(),
        }),
    },
}

export const handler: Handlers['AuthSignup'] = async (req, { logger }) => {
    const { email, password, name } = req.body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
        return {
            status: 400,
            body: { error: 'User already exists' },
        }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
        },
    })

    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })

    logger.info(`User registered and logged in: ${email}`)

    return {
        status: 201,
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
