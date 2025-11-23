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
            : "Hello! I am your AI Medical Assistant. How can I help you today? You can describe your symptoms or upload a medical report.";
        setMessages([{ role: 'assistant', content: greeting }]);
    }, [user?.role]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (text, file) => {
        const newMessage = { role: 'user', content: text, image: file };
        setMessages(prev => [...prev, newMessage]);
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            const response = {
                role: 'assistant',
                content: user?.role === 'doctor'
                    ? "I've analyzed the clinical data. Based on the symptoms and history provided, here are the potential differentials..."
                    : "I understand. Based on what you described, it sounds like you might be experiencing..."
            };
            setMessages(prev => [...prev, response]);
            setIsTyping(false);
        }, 2000);
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
