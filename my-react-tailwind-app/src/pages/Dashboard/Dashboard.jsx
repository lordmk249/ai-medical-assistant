import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Stethoscope, User, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleRoleSelect = (role) => {
        login(role, 'medical');
        navigate('/assistant');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15
            }
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-[80vh] space-y-8 overflow-hidden">
            {/* Animated gradient mesh background */}
            <div className="absolute inset-0 opacity-50" style={{
                background: 'radial-gradient(at 40% 20%, hsla(188, 94%, 43%, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189, 94%, 57%, 0.15) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(245, 83%, 65%, 0.1) 0px, transparent 50%)'
            }} />

            {/* Floating particles */}
            <div className="absolute top-20 left-20 w-32 h-32 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 floating" style={{ animationDelay: '0s' }} />
            <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 floating" style={{ animationDelay: '2s' }} />
            <div className="absolute bottom-20 left-40 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 floating" style={{ animationDelay: '4s' }} />

            <motion.div
                className="relative z-10 text-center space-y-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="text-cyan-500 w-8 h-8" />
                    <h1 className="text-5xl font-bold gradient-text">AI Medical Assistant</h1>
                    <Sparkles className="text-purple-500 w-8 h-8" />
                </div>
                <p className="text-xl text-gray-600 font-medium">Select your role to unlock intelligent healthcare insights</p>
            </motion.div>

            <motion.div
                className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Doctor Card */}
                <motion.button
                    onClick={() => handleRoleSelect('doctor')}
                    className="group relative flex flex-col items-center p-8 glass-card rounded-3xl shimmer overflow-hidden"
                    variants={itemVariants}
                    whileHover={{
                        scale: 1.05,
                        boxShadow: "0 20px 60px rgba(13, 148, 136, 0.3)"
                    }}
                    whileTap={{ scale: 0.98 }}
                >
                    {/* Gradient border effect */}
                    <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                            background: 'linear-gradient(135deg, #0d9488, #06b6d4)',
                            padding: '2px',
                            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                            WebkitMaskComposite: 'xor',
                            maskComposite: 'exclude'
                        }}
                    />

                    <motion.div
                        className="p-6 rounded-full mb-6 relative"
                        style={{
                            background: 'linear-gradient(135deg, #0d9488, #06b6d4)'
                        }}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Stethoscope size={48} className="text-white" />
                    </motion.div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Doctor View</h2>
                    <p className="text-gray-600 text-center">Access advanced diagnostics and clinical analysis tools</p>

                    {/* Hover indicator */}
                    <motion.div
                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100"
                        initial={{ y: 10 }}
                        whileHover={{ y: 0 }}
                    >
                        <div className="px-4 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg, #0d9488, #06b6d4)' }}
                        >
                            Click to continue →
                        </div>
                    </motion.div>
                </motion.button>

                {/* Patient Card */}
                <motion.button
                    onClick={() => handleRoleSelect('patient')}
                    className="group relative flex flex-col items-center p-8 glass-card rounded-3xl shimmer overflow-hidden"
                    variants={itemVariants}
                    whileHover={{
                        scale: 1.05,
                        boxShadow: "0 20px 60px rgba(99, 102, 241, 0.3)"
                    }}
                    whileTap={{ scale: 0.98 }}
                >
                    {/* Gradient border effect */}
                    <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            padding: '2px',
                            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                            WebkitMaskComposite: 'xor',
                            maskComposite: 'exclude'
                        }}
                    />

                    <motion.div
                        className="p-6 rounded-full mb-6 relative"
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)'
                        }}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                    >
                        <User size={48} className="text-white" />
                    </motion.div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Patient View</h2>
                    <p className="text-gray-600 text-center">Understand your medical reports in simple terms</p>

                    {/* Hover indicator */}
                    <motion.div
                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100"
                        initial={{ y: 10 }}
                        whileHover={{ y: 0 }}
                    >
                        <div className="px-4 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                        >
                            Click to continue →
                        </div>
                    </motion.div>
                </motion.button>
            </motion.div>

            {/* Bottom accent */}
            <motion.div
                className="relative z-10 text-center text-sm text-gray-500 mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
            >
                Powered by AI · Secure · Private
            </motion.div>
        </div>
    );
};

export default Dashboard;
