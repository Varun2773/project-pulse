import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const config: ApiRouteConfig = {
    type: 'api',
    name: 'AnalyzeIncident',
    description: 'Analyzes an incident using AI to provide fix suggestions',
    path: '/incidents/:id/analyze',
    method: 'POST',
    emits: [],
    responseSchema: {
        200: z.object({
            suggestion: z.string(),
            analysis: z.string()
        }),
        404: z.object({
            error: z.string()
        }),
        400: z.object({
            error: z.string()
        })
    }
}

export const handler: Handlers['AnalyzeIncident'] = async (req, { logger }) => {
    logger.info(`[DEBUG] Method: ${(req as any).method}`)
    logger.info(`[DEBUG] URL: ${(req as any).url}`)
    // Motia uses pathParams, not params
    const { id } = (req as any).pathParams || {}

    if (!id) {
        return { status: 400, body: { error: 'Missing incident ID' } }
    }

    const incident = await prisma.incident.findUnique({
        where: { id },
        include: { service: true }
    })

    if (!incident) {
        return { status: 404, body: { error: 'Incident not found' } }
    }

    // AI Simulation Logic (Heuristics to mimic LLM)
    // In a real scenario, this would call OpenAI/Gemini API
    let analysis = `Analyzing incident for ${incident.service.base_url}...`
    let suggestion = ''

    if (incident.error_code === 'ECONNREFUSED') {
        analysis += `\nError code ECONNREFUSED detected.`
        suggestion = `**Possible Cause:** The service is down or not accepting connections on port 80/443.\n\n**Suggested Fix:**\n1. Check if the server process is running.\n2. Verify firewall rules.\n3. Check load balancer health.`
    } else if (incident.error_code === 'ETIMEDOUT') {
        analysis += `\nRequest timed out after ${incident.latency || 10000}ms.`
        suggestion = `**Possible Cause:** Server is overloaded or network congestion.\n\n**Suggested Fix:**\n1. Check CPU/Memory usage on the server.\n2. Optimize database queries if applicable.\n3. Increase timeout thresholds if this is a heavy operation.`
    } else if (incident.status === 'degraded') {
        analysis += `\nHigh latency detected: ${incident.latency}ms.`
        suggestion = `**Possible Cause:** Performance degradation.\n\n**Suggested Fix:**\n1. Check for resource contention.\n2. Review application logs for slow operations.\n3. Consider scaling up the instance.`
    } else if (incident.reason.includes('404')) {
        analysis += `\nHTTP 404 Not Found returned.`
        suggestion = `**Possible Cause:** The health check path \`${incident.service.health_path}\` does not exist.\n\n**Suggested Fix:**\n1. Verify the health path configuration.\n2. Ensure the deployment was successful.`
    } else if (incident.reason.includes('500')) {
        analysis += `\nHTTP 500 Internal Server Error.`
        suggestion = `**Possible Cause:** Unhandled exception in the application.\n\n**Suggested Fix:**\n1. Check application error logs for stack traces.\n2. Verify recent code deployments.\n3. Check database connectivity.`
    } else {
        analysis += `\nUnknown error pattern.`
        suggestion = `**AI Analysis:**\nBased on the error signature, we recommend checking the application logs and ensuring the service dependencies are healthy.`
    }

    // Save suggestion to DB
    await prisma.incident.update({
        where: { id },
        data: { suggestion }
    })

    // Simulate "thinking" time for effect
    await new Promise(r => setTimeout(r, 1500))

    return {
        status: 200,
        body: {
            analysis,
            suggestion
        }
    }
}
