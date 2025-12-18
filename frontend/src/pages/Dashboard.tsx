import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, AlertTriangle, XCircle, Clock, Trash2 } from 'lucide-react'
import { Card, Button } from '../components/ui'

interface Service {
    id: string
    base_url: string
    health_path: string
    last_status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
    created_at: string
}

export function Dashboard() {
    const [data, setData] = useState<{ services: Service[], incidents: any[] }>({ services: [], incidents: [] })
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    const fetchData = async () => {
        const token = localStorage.getItem('token')
        if (!token) {
            navigate('/login')
            return
        }

        try {
            const res = await fetch('/dashboard/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (res.ok) {
                const json = await res.json()
                setData(json)
            } else if (res.status === 401) {
                localStorage.removeItem('token')
                navigate('/login')
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this service?')) return

        const token = localStorage.getItem('token')
        try {
            const res = await fetch(`/services/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (res.ok) {
                fetchData() // Refresh list
            } else {
                alert('Failed to delete service')
            }
        } catch (e) {
            console.error(e)
            alert('Error deleting service')
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 10000) // Poll every 10s
        return () => clearInterval(interval)
    }, [])

    if (loading && !data.services.length) {
        return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle className="text-green-500 h-5 w-5" />
            case 'degraded': return <AlertTriangle className="text-yellow-500 h-5 w-5" />
            case 'unhealthy': return <XCircle className="text-red-500 h-5 w-5" />
            default: return <Clock className="text-gray-400 h-5 w-5" />
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">System Status</h1>
                <Link to="/register-service">
                    <Button>+ Register Service</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                    <h3 className="text-sm font-medium text-gray-500">Total Services</h3>
                    <p className="text-2xl font-bold mt-1">{data.services.length}</p>
                </Card>
                <Card className="p-4">
                    <h3 className="text-sm font-medium text-gray-500">Healthy</h3>
                    <p className="text-2xl font-bold mt-1 text-green-600">
                        {data.services.filter(s => s.last_status === 'healthy').length}
                    </p>
                </Card>
                <Card className="p-4">
                    <h3 className="text-sm font-medium text-gray-500">Incidents</h3>
                    <p className="text-2xl font-bold mt-1 text-red-600">
                        {data.services.filter(s => s.last_status === 'unhealthy' || s.last_status === 'degraded').length}
                    </p>
                </Card>
            </div>

            <h2 className="text-lg font-semibold mt-8 mb-4">Service Status</h2>
            <div className="grid gap-4">
                {data.services.map(service => (
                    <Card key={service.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-full ${getStatusColor(service.last_status)} bg-opacity-20`}>
                                {getStatusIcon(service.last_status)}
                            </div>
                            <div>
                                <h3 className="font-medium">{service.base_url}</h3>
                                <p className="text-sm text-gray-500">{service.health_path}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(service.last_status)}`}>
                                {service.last_status.toUpperCase()}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                onClick={() => handleDelete(service.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}

                {data.services.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                        No services registered yet.
                    </div>
                )}
            </div>
        </div>
    )
}
