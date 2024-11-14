import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const ChatRoom = () => {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const username = Cookies.get('username');
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [invitedUser, setInvitedUser] = useState('');

  useEffect(() => {
    // const newSocket = io('http://localhost:3000');
    // const newSocket = io('http://172.31.48.151:3000');
    const newSocket = io('http://184.73.140.196:3000');
    setSocket(newSocket);

    newSocket.emit('joinChat', { username, chatId });

    newSocket.on('chatHistory', (chatHistory) => {
      setMessages(chatHistory);
    });

    newSocket.on('newMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [username, chatId]);

  const sendMessage = () => {
    if (newMessage.trim() !== '') {
      socket.emit('sendMessage', {
        username,
        chatId,
        message: newMessage,
      });
      setNewMessage('');
    }
  };

  const handleLeaveChat = () => {
    socket.emit('leaveChat', { username, chatId });
    navigate('/' + username + '/chatlist');
  };

  return (
    <div className="flex justify-center align-items:center w-screen">
    <div className="flex flex-col justify-center align-items:center h-screen w-[600px]">
      <h2 className="text-2xl font-bold mb-4">Chat Room: {chatId}</h2>
      <div className="flex-1 overflow-y-auto border border-gray-300 rounded-md p-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`mb-2 ${
            message.from === username ? 'text-right' : 'text-left'
          }`}
        >
          <div
            className={`inline-block p-2 rounded-md ${
              message.from === username ? 'bg-blue-500 text-white' : 'bg-green-500'
            }`}
          >
            {message.from !== username && (
              <div className="font-bold">{message.from}</div>
            )}
            {message.message}
          </div>
        </div>
      ))}
      </div>
      <div className="flex-shrink-0">
        <div className="flex mt-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>
        <div className="flex mt-4">
          <input
            type="text"
            value={invitedUser}
            onChange={(e) => setInvitedUser(e.target.value)}
            placeholder="Invite a user..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => socket.emit('inviteUser', { username, chatId, invitedUser })}
            className="px-4 py-2 bg-green-500 text-white rounded-r-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Invite User
          </button>
        </div>
        <button
          onClick={handleLeaveChat}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Leave Chat
        </button>
      </div>
    </div>
    </div>
  );
};

export default ChatRoom;
