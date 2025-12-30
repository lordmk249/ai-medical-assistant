import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Lock, User, ArrowRight, XCircle } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const user = await login(username, password);
            // Short delay to show loading animation
            setTimeout(() => {
                if (user.role === 'doctor') {
                    navigate('/assistant');
                } else {
                    navigate('/dashboard');
                }
            }, 500);
        } catch (err) {
            setError(err.message || 'Failed to sign in');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-50">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-r from-teal-200/40 to-cyan-200/40 blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-l from-indigo-200/40 to-blue-200/40 blur-3xl" />
            </div>

            <motion.div
                className="relative z-10 w-full max-w-md p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-8 md:p-10">

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white mb-4 shadow-lg shadow-teal-500/20">
                            <Activity className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                            Welcome Back
                        </h2>
                        <p className="text-gray-500 mt-2 text-sm">Sign in to access your medical assistant</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <div className="relative group">
                                <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                                <input
                                    id="username"
                                    type="text"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none font-medium placeholder:text-gray-400"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none font-medium placeholder:text-gray-400"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                            >
                                <XCircle className="w-4 h-4" />
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="relative w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40 transform hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2 overflow-hidden group"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="text-center mt-6">
                            <p className="text-sm text-gray-500">
                                Don't have an account?{' '}
                                <Link to="/signup" className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                                    Create Account
                                </Link>
                            </p>
                        </div>
                    </form>

                    {/* Helper credentials for demo */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="bg-blue-50/50 rounded-lg p-3 text-xs text-blue-600 space-y-1 text-center">
                            <p><span className="font-semibold">Doctor:</span> doctor / medical</p>
                            <p><span className="font-semibold">Patient:</span> patient / medical</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
