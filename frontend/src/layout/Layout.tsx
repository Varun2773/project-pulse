import { Link, Outlet, useNavigate } from 'react-router-dom'
import { Activity, PlusCircle, LogOut, LayoutDashboard } from 'lucide-react'
export function Layout() {
    const navigate = useNavigate()
    const handleLogout = () => {
        localStorage.removeItem('token')
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar - Flex column layout */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="h-16 flex items-center px-6 border-b border-gray-200 flex-shrink-0">
                    <Activity className="h-6 w-6 text-blue-600 mr-2" />
                    <span className="font-bold text-lg">ProjectPulse</span>
                </div>

                {/* Navigation Links */}
                <nav className="p-4 space-y-1 flex-1">
                    <Link to="/dashboard" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-md">
                        <LayoutDashboard className="h-5 w-5 mr-3" />
                        Dashboard
                    </Link>
                    <Link to="/register-service" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-md">
                        <PlusCircle className="h-5 w-5 mr-3" />
                        Register Service
                    </Link>
                </nav>

                {/* Logout Button - Pushed to bottom with p-4 and border-t */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-md w-full transition-colors duration-200"
                    >
                        <LogOut className="h-5 w-5 mr-3" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <Outlet />
            </main>
        </div>
    )
}