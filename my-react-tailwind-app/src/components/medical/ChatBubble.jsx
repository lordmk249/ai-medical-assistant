import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, FileText } from 'lucide-react';
import clsx from 'clsx';

const ChatBubble = ({ message }) => {
  if (!message) return null;

  const isUser = message.role === 'user';

  return (
    <div className={clsx('flex gap-3 max-w-3xl mx-auto', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
        isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-teal-100 text-teal-600'
      )}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className={clsx(
        'p-4 rounded-2xl max-w-[80%]',
        isUser ? 'bg-indigo-500 text-white rounded-tr-none' : 'bg-white border border-gray-200 rounded-tl-none shadow-sm'
      )}>
        <div className={clsx('prose prose-sm max-w-none', isUser ? 'prose-invert' : 'text-gray-800')}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content || ''}
          </ReactMarkdown>
        </div>
        {message.image && (
          message.image.type?.startsWith('image/') ? (
            <img src={message.image.content} alt="User upload" className="mt-2 rounded-lg max-h-48 object-cover" />
          ) : (
            <div className="mt-2 flex items-center gap-2 bg-white/10 p-2 rounded-lg border border-white/20">
              <FileText size={20} />
              <span className="text-sm truncate">{message.image.name}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
