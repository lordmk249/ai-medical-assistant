import { useState, useRef } from 'react';
import { Send, Paperclip, X, FileText } from 'lucide-react';

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
            handleSend();
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedFile({
                    content: reader.result,
                    type: file.type,
                    name: file.name
                });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="bg-white border-t p-4">
            <div className="max-w-3xl mx-auto">
                {selectedFile && (
                    <div className="mb-2 relative inline-flex items-center gap-2 bg-gray-100 p-2 rounded-lg border">
                        {selectedFile.type.startsWith('image/') ? (
                            <img src={selectedFile.content} alt="Preview" className="h-12 w-12 object-cover rounded" />
                        ) : (
                            <div className="h-12 w-12 bg-red-100 text-red-600 flex items-center justify-center rounded">
                                <FileText size={24} />
                            </div>
                        )}
                        <span className="text-sm text-gray-600 truncate max-w-[150px]">{selectedFile.name}</span>
                        <button
                            onClick={() => setSelectedFile(null)}
                            className="bg-gray-200 text-gray-600 rounded-full p-1 hover:bg-gray-300"
                        >
                            <X size={12} />
                        </button>
                    </div>
                )}
                <div className="flex gap-2 items-end bg-gray-50 p-2 rounded-xl border focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-transparent transition-all">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-teal-600 transition-colors focus:outline-none"
                        disabled={disabled}
                        title="Upload File (Image or PDF)"
                    >
                        <Paperclip size={20} />
                    </button>
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
                        placeholder="Describe your symptoms or upload a report..."
                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 py-2 text-gray-800 placeholder-gray-400 focus:outline-none"
                        rows={1}
                        disabled={disabled}
                    />
                    <button
                        onClick={handleSend}
                        disabled={(!input.trim() && !selectedFile) || disabled}
                        className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InputArea;
