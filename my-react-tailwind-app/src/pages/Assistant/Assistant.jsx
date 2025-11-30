import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import ChatBubble from '../../components/medical/ChatBubble';
import InputArea from '../../components/medical/InputArea';
import { Bot, Stethoscope, User } from 'lucide-react';

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
            <div className="bg-white border-b px-4 py-2 flex items-center gap-2 shadow-sm">
                {user?.role === 'doctor' ? (
                    <div className="bg-teal-100 p-1.5 rounded-lg text-teal-700">
                        <Stethoscope size={18} />
                    </div>
                ) : (
                    <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-700">
                        <User size={18} />
                    </div>
                )}
                <span className="font-medium text-gray-700 capitalize">{user?.role} Mode</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
                {messages.map((msg, index) => (
                    <ChatBubble key={index} message={msg} />
                ))}
                {isTyping && (
                    <div className="flex gap-3 max-w-3xl mx-auto">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-none shadow-sm">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <InputArea onSendMessage={handleSendMessage} disabled={isTyping} />
        </div>
    );
};

export default Assistant;
