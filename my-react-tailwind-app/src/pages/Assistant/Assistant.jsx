import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import ChatBubble from '../../components/medical/ChatBubble';
import InputArea from '../../components/medical/InputArea';
import { Bot, Stethoscope, User } from 'lucide-react';
import { motion } from 'framer-motion';

const Assistant = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const greeting = user?.role === 'doctor'
            ? "Welcome, Doctor. I am ready to assist with patient diagnosis and record analysis. Please upload patient records or describe symptoms."
            : "Hi there! 👋 I'm your AI health helper. I can explain your medical reports in simple words. Just upload a photo or PDF of your report!";
        setMessages([{ role: 'assistant', content: greeting }]);
    }, [user?.role]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (text, fileData) => {
        const newMessage = { role: 'user', content: text, image: fileData };
        setMessages(prev => [...prev, newMessage]);
        setIsTyping(true);

        if (!fileData?.file) {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "Please upload a medical report (PDF or Image) for me to analyze. I currently require a file to provide medical insights."
                }]);
                setIsTyping(false);
            }, 600);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', fileData.file);
            formData.append('translate_to', 'ar'); // Default to Arabic as per requirements

            const res = await fetch('/process', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Server error (${res.status}): ${errText}`);
            }

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Format the structured response into Markdown based on Role
            let markdownResponse = "";

            if (user?.role === 'patient') {
                // Patient View: EXTREMELY Simple
                markdownResponse += `### 👋 Simple Explanation\n\n`;

                if (data.translation) {
                    markdownResponse += `${data.translation}\n\n`;
                } else if (data.summary) {
                    markdownResponse += `${data.summary}\n\n`;
                }

                markdownResponse += `\n---\n*⚠️ Important: I am an AI, not a doctor. Please show this to your doctor for real medical advice.*`;

            } else {
                // Doctor View: Detailed and Clinical
                markdownResponse += `### 🩺 Clinical Analysis\n\n`;

                if (data.summary) {
                    markdownResponse += `**Clinical Summary:**\n${data.summary}\n\n`;
                }

                if (data.entities && Object.keys(data.entities).length > 0) {
                    markdownResponse += `**Extracted Entities:**\n`;
                    Object.entries(data.entities).forEach(([category, items]) => {
                        if (Array.isArray(items) && items.length > 0) {
                            markdownResponse += `- **${category}:** ${items.join(', ')}\n`;
                        }
                    });
                    markdownResponse += `\n`;
                }

                if (data.translation) {
                    markdownResponse += `--- \n**Translation (Arabic):**\n${data.translation}\n`;
                }
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: markdownResponse
            }]);

        } catch (error) {
            console.error("Analysis failed:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ **Analysis Failed**\n\nI encountered an error while processing your file:\n> ${error.message}\n\nPlease try again or check the file format.`
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="glass border-b px-6 py-3 flex items-center gap-3 shadow-md relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.9) 0%, rgba(6, 182, 212, 0.9) 100%)'
                }}
            >
                {/* Animated shimmer overlay */}
                <div className="absolute inset-0 shimmer opacity-20" />

                {user?.role === 'doctor' ? (
                    <motion.div
                        className="glass-card p-2 rounded-lg text-teal-700 relative z-10"
                        initial={{ rotate: 0 }}
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                        <Stethoscope size={20} />
                    </motion.div>
                ) : (
                    <motion.div
                        className="glass-card p-2 rounded-lg text-indigo-700 relative z-10"
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                        <User size={20} />
                    </motion.div>
                )}
                <span className="font-semibold text-white capitalize relative z-10 text-lg">
                    {user?.role} Mode
                </span>
                <div className="flex-1" />
                <div className="relative z-10 flex items-center gap-2 glass-card px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-400 rounded-full pulse-glow" />
                    <span className="text-xs font-medium text-gray-700">AI Active</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative"
                style={{
                    background: 'linear-gradient(to bottom, #f0f9ff, #fefce8)',
                    backgroundImage: 'radial-gradient(at 20% 30%, hsla(188, 94%, 43%, 0.08) 0px, transparent 50%), radial-gradient(at 80% 70%, hsla(245, 83%, 65%, 0.06) 0px, transparent 50%)'
                }}
            >
                {messages.map((msg, index) => (
                    <ChatBubble key={index} message={msg} />
                ))}
                {isTyping && (
                    <motion.div
                        className="flex gap-3 max-w-3xl mx-auto"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
                            <Bot size={18} />
                        </div>
                        <div className="glass-card p-5 rounded-2xl rounded-tl-none shadow-lg">
                            <div className="flex gap-1.5">
                                <motion.div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ background: 'linear-gradient(135deg, #0d9488, #06b6d4)' }}
                                    animate={{ y: [-3, 0, -3] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                />
                                <motion.div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ background: 'linear-gradient(135deg, #0d9488, #06b6d4)' }}
                                    animate={{ y: [-3, 0, -3] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                />
                                <motion.div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ background: 'linear-gradient(135deg, #0d9488, #06b6d4)' }}
                                    animate={{ y: [-3, 0, -3] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <InputArea onSendMessage={handleSendMessage} disabled={isTyping} />
        </div>
    );
};

export default Assistant;
