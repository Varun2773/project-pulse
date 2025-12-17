import { EventConfig, Handlers } from 'motia'
import { z } from 'zod'

const inputSchema = z.object({
    serviceId: z.string(),
    baseUrl: z.string(),
    healthPath: z.string()
})

export const config: EventConfig = {
    type: 'event',
    name: 'FetchHealth',
    description: 'Fetches health status from a service',
    subscribes: ['trigger-check'],
    emits: ['analyze-health'],
    input: inputSchema,
    flows: ['ServiceHealthCheckWorkflow']
}

export const handler: Handlers['FetchHealth'] = async (input, { emit, logger }) => {
    const { serviceId, baseUrl, healthPath } = input;
    const url = `${baseUrl}${healthPath}`;

    logger.info(`Checking health for service ${serviceId} at ${url}`)

    const startTime = Date.now()
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

        const response = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)

        const latency = Date.now() - startTime

        let responseBody = null
        try {
            responseBody = await response.json()
        } catch {
            // ignore json parse error
        }

        await (emit as any)({
            topic: 'analyze-health',
            data: {
                serviceId,
                statusCode: response.status,
                latency,
                errorType: null,
                healthPayload: responseBody
            }
        })
    } catch (error: any) {
        const latency = Date.now() - startTime
        const errorType = error.name === 'AbortError' ? 'ETIMEDOUT' : 'NETWORK_ERROR'

        await (emit as any)({
            topic: 'analyze-health',
            data: {
                serviceId,
                statusCode: 0,
                latency,
                errorType: errorType,
                healthPayload: null
            }
        })
    }
}
