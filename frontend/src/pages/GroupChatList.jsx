import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import io from 'socket.io-client';
import SideNav from '../components/SideNav';

const GroupChatList = () => {
  const navigate = useNavigate();
  const { username } = useParams();
  const [groupChats, setGroupChats] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // const newSocket = io('http://localhost:3000');
    // const newSocket = io('http://172.31.48.151:3000');
    const newSocket = io('http://184.73.140.196:3000');

    console.log(newSocket)

    newSocket.emit('getGroupChats', { username });

    newSocket.on('groupChatsList', (chats) => {
      setGroupChats(chats);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [username]);

  const handleChatClick = (chatId) => {
    navigate(`/${username}/chat/${chatId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <SideNav username={username}></SideNav>
      <h2 className="text-2xl mt-10 font-bold mb-4 text-black">Group Chats</h2>
      <ul className="space-y-4 text-black">
        {groupChats.map((chat) => (
          <li key={chat.group_id}>
            <button
              className="w-64 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              onClick={() => handleChatClick(chat.group_id)}
            >
              Group Chat: {chat.group_id}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GroupChatList;
