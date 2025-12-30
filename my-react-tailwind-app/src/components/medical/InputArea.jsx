import { useState, useRef } from 'react';
import { Send, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InputArea = ({ onSendMessage, disabled }) => {
    const [input, setInput] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleSend = () => {
        if ((!input.trim() && !selectedFile) || disabled) return;
        onSendMessage(input, selectedFile);
        setInput('');
        setSelectedFile(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.trim() || selectedFile) {
                handleSend();
            }
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedFile({
                    file: file,
                    content: reader.result,
                    type: file.type,
                    name: file.name
                });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="glass border-t p-4 backdrop-blur-xl sticky bottom-0">
            <div className="max-w-3xl mx-auto">
                <AnimatePresence>
                    {selectedFile && (
                        <motion.div
                            className="mb-3 relative inline-flex items-center gap-3 glass-card p-3 rounded-xl shadow-lg"
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        >
                            {selectedFile.type.startsWith('image/') ? (
                                <div className="relative">
                                    <img
                                        src={selectedFile.content}
                                        alt="Preview"
                                        className="h-16 w-16 object-cover rounded-lg shadow-md border-2 border-cyan-200"
                                    />
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                                        <ImageIcon size={12} className="text-white" />
                                    </div>
                                </div>
                            ) : (
                                <div className="h-16 w-16 bg-gradient-to-br from-red-400 to-orange-500 text-white flex items-center justify-center rounded-lg shadow-md">
                                    <FileText size={28} />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{selectedFile.name}</p>
                                <p className="text-xs text-gray-500">
                                    {selectedFile.type.startsWith('image/') ? 'Image' : 'PDF Document'}
                                </p>
                            </div>
                            <motion.button
                                onClick={() => setSelectedFile(null)}
                                className="bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded-full p-1.5 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <X size={14} />
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex gap-3 items-end glass-card p-3 rounded-2xl focus-within:ring-2 focus-within:ring-cyan-400 focus-within:ring-offset-2 transition-all">
                    <motion.button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 text-gray-400 hover:text-cyan-600 transition-colors focus:outline-none rounded-xl hover:bg-cyan-50"
                        disabled={disabled}
                        title="Upload File (Image or PDF)"
                        whileHover={{ scale: 1.1, rotate: 15 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Paperclip size={22} />
                    </motion.button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                    />
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe your symptoms or upload a medical report..."
                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 py-2 text-gray-800 placeholder-gray-400 focus:outline-none"
                        rows={1}
                        disabled={disabled}
                    />
                    <motion.button
                        onClick={handleSend}
                        disabled={(!input.trim() && !selectedFile) || disabled}
                        className="p-3 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 shadow-lg relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)'
                        }}
                        whileHover={!disabled && (!input.trim() && !selectedFile) ? {} : { scale: 1.05 }}
                        whileTap={!disabled && (!input.trim() && !selectedFile) ? {} : { scale: 0.95 }}
                    >
                        {/* Pulse effect when ready to send */}
                        {!disabled && (input.trim() || selectedFile) && (
                            <motion.div
                                className="absolute inset-0"
                                style={{
                                    background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)'
                                }}
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 0, 0.5]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                        )}
                        <Send size={20} className="relative z-10" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default InputArea;
