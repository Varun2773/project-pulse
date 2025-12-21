import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react'
import { Card } from '../components/ui'

export function PublicStatus() {
    const { userId } = useParams()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(`/api/status/${userId}`)
                if (!res.ok) throw new Error('Status page not found')
                const json = await res.json()
                setData(json)
            } catch (e: any) {
                setError(e.message)
            } finally {
                setLoading(false)
            }
        }
        fetchStatus()
    }, [userId])

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle className="text-green-500 h-5 w-5" />
            case 'degraded': return <AlertTriangle className="text-yellow-500 h-5 w-5" />
            case 'unhealthy': return <XCircle className="text-red-500 h-5 w-5" />
            default: return <Activity className="text-gray-400 h-5 w-5" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'bg-green-50 text-green-700 border-green-200'
            case 'degraded': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
            case 'unhealthy': return 'bg-red-50 text-red-700 border-red-200'
            default: return 'bg-gray-50 text-gray-700 border-gray-200'
        }
    }

    const overallColor = data.summary.status === 'operational' ? 'bg-green-600' :
        data.summary.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-600'

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
            <div className="max-w-3xl w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                        <Activity className="h-10 w-10 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">{data.user.name}'s Status</h1>
                    <p className="mt-2 text-gray-500">Live service status updates</p>
                </div>

                {/* Overall Status Banner */}
                <div className={`${overallColor} text-white p-6 rounded-lg shadow-lg flex items-center justify-between`}>
                    <div>
                        <h2 className="text-xl font-bold capitalize">
                            {data.summary.status === 'operational' ? 'All Systems Operational' :
                                data.summary.status === 'degraded' ? 'Partial System Outage' : 'Major System Outage'}
                        </h2>
                        <p className="opacity-90 mt-1">Updated {new Date().toLocaleTimeString()}</p>
                    </div>
                    <div className="text-4xl font-bold opacity-80">{data.summary.uptime}%</div>
                </div>

                {/* Services List */}
                <div className="space-y-4">
                    {data.services.map((service: any) => (
                        <Card key={service.id} className="p-4 flex items-center justify-between transition-shadow hover:shadow-md">
                            <div className="flex items-center space-x-4">
                                <div className={`p-2 rounded-full ${getStatusColor(service.last_status)} bg-opacity-20`}>
                                    {getStatusIcon(service.last_status)}
                                </div>
                                <div>
                                    <h3 className="font-medium text-lg">{service.base_url}</h3>
                                    <p className="text-sm text-gray-500">
                                        Last checked: {service.last_checked_at ? new Date(service.last_checked_at).toLocaleTimeString() : 'Never'}
                                    </p>
                                </div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(service.last_status)}`}>
                                {service.last_status.toUpperCase()}
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="text-center text-sm text-gray-400 mt-8">
                    Powered by <span className="font-bold text-gray-500">Project Pulse</span>
                </div>
            </div>
        </div>
    )
}
