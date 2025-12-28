import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, User, LogOut, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = ({ toggleSidebar }) => {
    const { user, login, logout } = useAuth();

    return (
        <nav className="glass border-b shadow-lg relative overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.95) 0%, rgba(6, 182, 212, 0.95) 100%)'
            }}
        >
            {/* Animated shimmer */}
            <div className="absolute inset-0 shimmer opacity-10" />

            <div className="text-white p-4 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                    <motion.button
                        onClick={toggleSidebar}
                        className="p-2 hover:bg-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors backdrop-blur-sm"
                        whileHover={{ scale: 1.05, rotate: 90 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Menu size={24} />
                    </motion.button>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-cyan-200" />
                        <h1 className="text-xl font-bold">AI Medical Assistant</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <motion.button
                        onClick={() => login(user?.role === 'doctor' ? 'patient' : 'doctor')}
                        className="glass-card px-4 py-2 rounded-xl text-sm font-semibold transition-all text-gray-700 hover:text-gray-900 shadow-md"
                        whileHover={{ scale: 1.05, boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Switch to {user?.role === 'doctor' ? 'Patient' : 'Doctor'}
                    </motion.button>
                    <div className="hidden md:flex items-center gap-2 glass-card px-3 py-1.5 rounded-xl">
                        <User size={18} className="text-cyan-700" />
                        <span className="text-sm font-medium text-gray-700">{user?.name} ({user?.role})</span>
                    </div>
                    <motion.button
                        onClick={logout}
                        className="p-2 hover:bg-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors backdrop-blur-sm"
                        title="Logout"
                        whileHover={{ scale: 1.1, rotate: 15 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <LogOut size={20} />
                    </motion.button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
