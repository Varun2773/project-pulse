import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card } from '../components/ui'

export function RegisterService() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        base_url: '',
        health_path: '/health',
        alert_email: '',
        check_interval: 5
    })
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to register service')

            navigate('/dashboard')
        } catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Register New Service</h1>

            <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">{error}</div>}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                        <Input
                            type="url"
                            placeholder="https://api.example.com"
                            value={formData.base_url}
                            onChange={e => setFormData({ ...formData, base_url: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Health Path</label>
                        <Input
                            type="text"
                            placeholder="/health"
                            value={formData.health_path}
                            onChange={e => setFormData({ ...formData, health_path: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alert Email</label>
                        <Input
                            type="email"
                            placeholder="admin@example.com"
                            value={formData.alert_email}
                            onChange={e => setFormData({ ...formData, alert_email: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Check Interval (minutes)</label>
                        <Input
                            type="number"
                            min="1"
                            value={formData.check_interval}
                            onChange={e => setFormData({ ...formData, check_interval: parseInt(e.target.value) })}
                            required
                        />
                    </div>

                    <div className="pt-4">
                        <Button type="submit">Register Service</Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}
