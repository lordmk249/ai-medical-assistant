import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Heart, Languages, Zap, ArrowRight, Stethoscope, Brain, Activity } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: Brain,
            title: 'AI-Powered Analysis',
            description: 'Advanced machine learning to analyze medical reports with precision'
        },
        {
            icon: Stethoscope,
            title: 'Doctor & Patient Views',
            description: 'Tailored experiences for medical professionals and patients'
        },
        {
            icon: Languages,
            title: 'Support both arabic and english',
            description: 'Your medical data is in the same language as your report'

        },
        {
            icon: Activity,
            title: 'Real-time Insights',
            description: 'Get instant analysis and explanations of your medical reports'
        }
    ];

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 opacity-60" style={{
                background: 'radial-gradient(at 40% 20%, hsla(188, 94%, 43%, 0.2) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189, 94%, 57%, 0.2) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(245, 83%, 65%, 0.15) 0px, transparent 50%)'
            }} />

            {/* Floating particles */}
            <div className="absolute top-20 left-20 w-40 h-40 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 floating" style={{ animationDelay: '0s' }} />
            <div className="absolute top-1/3 right-20 w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 floating" style={{ animationDelay: '2s' }} />
            <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 floating" style={{ animationDelay: '4s' }} />

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:py-20">
                {/* Hero Section */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <motion.div
                        className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full mb-6"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    >
                        <Sparkles className="w-5 h-5 text-cyan-600" />
                        <span className="text-sm font-semibold text-gray-700">Graduation Project</span>
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6">
                        <span className="gradient-text">AI Medical Assistant</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        Understand your medical reports with the power of artificial intelligence.
                        Get instant, accurate insights in simple language.
                    </p>

                    <div className="flex gap-4 justify-center">
                        <motion.button
                            onClick={() => navigate('/login')}
                            className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold text-teal-600 bg-white shadow-lg border border-teal-100 hover:border-teal-200"
                            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.05)" }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span>Sign In</span>
                        </motion.button>

                        <motion.button
                            onClick={() => navigate('/signup')}
                            className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold text-white shadow-2xl relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)'
                            }}
                            whileHover={{ scale: 1.05, boxShadow: "0 25px 50px rgba(13, 148, 136, 0.4)" }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="relative z-10">Get Started</span>
                            <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />

                            {/* Animated shine effect */}
                            <motion.div
                                className="absolute inset-0"
                                style={{
                                    background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)'
                                }}
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.5, 0, 0.5]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                        </motion.button>
                    </div>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="glass-card p-6 rounded-2xl group hover:shadow-2xl transition-all"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            whileHover={{ y: -5 }}
                        >
                            <div className="p-3 rounded-xl mb-4 inline-block"
                                style={{
                                    background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)'
                                }}
                            >
                                <feature.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{feature.title}</h3>
                            <p className="text-gray-600 text-sm">{feature.description}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Trust Section */}
                <motion.div
                    className="text-center glass-card p-8 rounded-3xl"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 }}
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Heart className="w-6 h-6 text-red-500" />
                        <h2 className="text-2xl font-bold text-gray-800">Built with Care</h2>
                    </div>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Our AI assistant is designed to make healthcare more accessible.
                        While we provide insights, always consult with your healthcare provider for medical decisions.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <Languages className="w-4 h-4 text-cyan-600" />
                            <span>End-to-end Encryption</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-cyan-600" />
                            <span>Instant Analysis</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-cyan-600" />
                            <span>Patient-Centered</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Landing;
