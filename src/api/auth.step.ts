import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'

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
                email: z.string(),
            }),
        }),
        401: z.object({
            error: z.string(),
        }),
    },
}

export const handler: Handlers['AuthLogin'] = async (req, { logger }) => {
    const { email, password } = req.body

    // Simple demo auth
    if (email === 'admin@example.com' && password === 'password') {
        return {
            status: 200,
            body: {
                token: 'demo-token',
                user: { email },
            },
        }
    }

    return {
        status: 401,
        body: {
            error: 'Invalid credentials',
        },
    }
}
