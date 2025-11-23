import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, X } from 'lucide-react';
import clsx from 'clsx';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const location = useLocation();

    const links = [
        { path: '/', name: 'Dashboard', icon: LayoutDashboard },
        { path: '/assistant', name: 'AI Assistant', icon: MessageSquare },
    ];

    return (
        <aside
            className={clsx(
                'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0',
                isOpen ? 'translate-x-0' : '-translate-x-full'
            )}
        >
            <div className="p-4 flex justify-between items-center border-b md:hidden">
                <h2 className="font-bold text-lg">Menu</h2>
                <button onClick={toggleSidebar} className="p-1 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <X size={24} />
                </button>
            </div>
            <nav className="p-4 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={clsx(
                                'flex items-center gap-3 p-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500',
                                isActive ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            )}
                            onClick={() => window.innerWidth < 768 && toggleSidebar()}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{link.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
