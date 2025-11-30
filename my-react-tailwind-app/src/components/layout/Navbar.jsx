import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, User, LogOut } from 'lucide-react';

const Navbar = ({ toggleSidebar }) => {
    const { user, login, logout } = useAuth();

    return (
        <nav className="bg-teal-600 text-white p-4 shadow-md flex justify-between items-center">
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="p-1 hover:bg-teal-700 rounded focus:outline-none focus:ring-2 focus:ring-white">
                    <Menu size={24} />
                </button>
                <h1 className="text-xl font-bold">AI Medical Assistant</h1>
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={() => login(user?.role === 'doctor' ? 'patient' : 'doctor')}
                    className="bg-teal-700 hover:bg-teal-800 px-3 py-1 rounded text-sm font-medium transition-colors border border-teal-500"
                >
                    Switch to {user?.role === 'doctor' ? 'Patient' : 'Doctor'}
                </button>
                <div className="flex items-center gap-2">
                    <User size={20} />
                    <span className="hidden md:inline">{user?.name} ({user?.role})</span>
                </div>
                <button onClick={logout} className="p-1 hover:bg-teal-700 rounded focus:outline-none focus:ring-2 focus:ring-white" title="Logout">
                    <LogOut size={20} />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
