import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, X, Home } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const location = useLocation();

    const links = [
        { path: '/', name: 'Home', icon: Home },
        { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { path: '/assistant', name: 'AI Assistant', icon: MessageSquare },
    ];

    return (
        <AnimatePresence>
            {(isOpen || window.innerWidth >= 768) && (
                <motion.aside
                    className={clsx(
                        'fixed inset-y-0 left-0 z-50 w-64 glass-dark shadow-2xl md:relative',
                        'border-r border-white/10'
                    )}
                    initial={{ x: -256 }}
                    animate={{ x: 0 }}
                    exit={{ x: -256 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    {/* Header */}
                    <div className="p-4 flex justify-between items-center border-b border-white/10 md:hidden">
                        <h2 className="font-bold text-lg text-white">Menu</h2>
                        <motion.button
                            onClick={toggleSidebar}
                            className="p-2 hover:bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-gray-300 hover:text-white transition-colors"
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <X size={24} />
                        </motion.button>
                    </div>

                    {/* Navigation */}
                    <nav className="p-4 space-y-2">
                        {links.map((link, index) => {
                            const Icon = link.icon;
                            const isActive = location.pathname === link.path;
                            return (
                                <motion.div
                                    key={link.path}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link
                                        to={link.path}
                                        className={clsx(
                                            'flex items-center gap-3 p-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 group relative overflow-hidden',
                                            isActive
                                                ? 'glass-card text-gray-900 shadow-lg'
                                                : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                        )}
                                        onClick={() => window.innerWidth < 768 && toggleSidebar()}
                                    >
                                        {/* Gradient underline for active */}
                                        {isActive && (
                                            <motion.div
                                                className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full"
                                                style={{
                                                    background: 'linear-gradient(90deg, #0d9488, #06b6d4)'
                                                }}
                                                layoutId="activeNav"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}

                                        {/* Icon with gradient on active */}
                                        <div className={clsx(
                                            'p-1.5 rounded-lg',
                                            isActive && 'bg-gradient-to-br from-teal-500 to-cyan-600'
                                        )}>
                                            <Icon
                                                size={20}
                                                className={isActive ? 'text-white' : ''}
                                            />
                                        </div>

                                        <span className="font-medium relative z-10">{link.name}</span>

                                        {/* Hover gradient overlay */}
                                        {!isActive && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-cyan-500/5 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </nav>

                    {/* Bottom decoration */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-teal-900/20 to-transparent pointer-events-none" />
                </motion.aside>
            )}
        </AnimatePresence>
    );
};

export default Sidebar;
