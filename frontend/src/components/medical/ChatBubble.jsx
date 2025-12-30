import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, FileText } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const ChatBubble = ({ message }) => {
  if (!message) return null;

  const isUser = message.role === 'user';

  return (
    <motion.div
      className={clsx('flex gap-3 max-w-3xl mx-auto', isUser ? 'flex-row-reverse' : 'flex-row')}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.div
        className={clsx(
          'w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md',
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
            : 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white'
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
      >
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </motion.div>

      <motion.div
        className={clsx(
          'p-4 rounded-2xl max-w-[80%] relative',
          isUser
            ? 'rounded-tr-none shadow-lg'
            : 'glass-card rounded-tl-none'
        )}
        style={isUser ? {
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          color: 'white'
        } : {}}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, duration: 0.2 }}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      >
        {/* Glow effect for AI messages */}
        {!isUser && (
          <div className="absolute inset-0 rounded-2xl rounded-tl-none opacity-0 hover:opacity-100 transition-opacity duration-300"
            style={{
              boxShadow: '0 0 20px rgba(13, 148, 136, 0.3)'
            }}
          />
        )}

        <div className={clsx(
          'prose prose-sm max-w-none relative z-10',
          isUser ? 'prose-invert' : 'text-gray-800'
        )}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content || ''}
          </ReactMarkdown>
        </div>

        {message.image && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {message.image.type?.startsWith('image/') ? (
              <img
                src={message.image.content}
                alt="User upload"
                className="mt-3 rounded-xl max-h-48 object-cover shadow-lg border-2 border-white/20"
              />
            ) : (
              <div className={clsx(
                'mt-3 flex items-center gap-2 p-3 rounded-xl border',
                isUser
                  ? 'bg-white/10 border-white/20 backdrop-blur-sm'
                  : 'bg-gray-50 border-gray-200'
              )}>
                <div className={clsx(
                  'p-2 rounded-lg',
                  isUser ? 'bg-white/20' : 'bg-red-100'
                )}>
                  <FileText size={20} className={isUser ? 'text-white' : 'text-red-600'} />
                </div>
                <span className={clsx(
                  'text-sm truncate font-medium',
                  isUser ? 'text-white' : 'text-gray-700'
                )}>
                  {message.image.name}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ChatBubble;
