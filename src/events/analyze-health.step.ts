import { EventConfig, Handlers } from 'motia'
import { z } from 'zod'

const inputSchema = z.object({
    serviceId: z.string(),
    statusCode: z.number(),
    latency: z.number(),
    errorType: z.string().nullable(),
    healthPayload: z.any().nullable()
})

export const config: EventConfig = {
    type: 'event',
    name: 'AnalyzeHealth',
    description: 'Analyzes health metrics to determine status',
    subscribes: ['analyze-health'],
    emits: ['store-incident'],
    input: inputSchema,
    flows: ['ServiceHealthCheckWorkflow']
}

export const handler: Handlers['AnalyzeHealth'] = async (input, { emit, logger }) => {
    const { serviceId, statusCode, latency, errorType, healthPayload } = input;

    let finalStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    let reason = 'Service is healthy'
    let errorCode = null

    // Decision Rules
    if (errorType || statusCode >= 500) {
        finalStatus = 'unhealthy'
        reason = errorType ? `Network Error: ${errorType}` : `HTTP Error: ${statusCode}`
        errorCode = errorType || `HTTP_${statusCode}`
    } else if ((healthPayload as any)?.status === 'unhealthy') {
        finalStatus = 'unhealthy'
        reason = (healthPayload as any).error_code || 'Application reported unhealthy'
        errorCode = (healthPayload as any).error_code
    } else if (latency > 5000) { // 5s threshold
        finalStatus = 'degraded'
        reason = `High Latency: ${latency}ms`
    }

    await (emit as any)({
        topic: 'store-incident',
        data: {
            serviceId,
            status: finalStatus,
            reason,
            errorCode,
            latency
        }
    })
}
