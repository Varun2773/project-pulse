import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { Button, Input, Card } from '../components/ui'

export function RegisterUser() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    })
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Signup failed')

            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            navigate('/dashboard')
        } catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md p-8">
                <div className="flex items-center justify-center">
                    <Activity className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Join ProjectPulse
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4 mt-8">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">{error}</div>}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <Input
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full">
                        Sign Up
                    </Button>

                    <div className="text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            Sign in
                        </Link>
                    </div>
                </form>
            </Card>
        </div>
    )
}
