import React, { useRef, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message {
  sender: string;
  message: string;
  timestamp?: string;
}

interface ChatProps {
  messages: Message[];
  email: string;
  roomId: string;
  socket: any;
}

const Chat = ({ messages, email, roomId, socket }: ChatProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socket.emit("chat:message", {
        room: roomId,
        message: newMessage.trim(),
        sender: email
      });
      setNewMessage('');
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-4 right-4 p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700"
      >
        <MessageCircle size={24} />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {messages.length}
          </span>
        )}
      </button>

      {isChatOpen && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg flex flex-col">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-semibold">Chat</h2>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X size={20} />
            </button>
          </div>
          
          <div 
            ref={chatContainerRef}
            className="flex-1 p-4 overflow-y-auto space-y-4"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  msg.sender === email ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.sender === 'System'
                      ? 'bg-gray-100 text-gray-600 text-center w-full'
                      : msg.sender === email
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {msg.sender !== 'System' && (
                    <p className="text-xs opacity-75 mb-1">{msg.sender}</p>
                  )}
                  <p className="text-sm">{msg.message}</p>
                  {msg.timestamp && (
                    <p className="text-xs opacity-75 mt-1 text-right">
                      {formatTime(msg.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <form onSubmit={sendMessage} className="p-4 border-t bg-gray-50">
            <div className="relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full p-2 pr-10 border rounded-md focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 disabled:text-gray-400"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Chat;