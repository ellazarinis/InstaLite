import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import ForgotPassword from "./pages/Forgotpassword";
import ResetPassword from "./pages/Resetpassword";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Requests from "./pages/Requests";
import SimilarActors from "./pages/SimilarActors";
import Friends from "./pages/Friends";
import Settings from "./pages/Settings";
import Hashtags from "./pages/Hashtags";
import GroupChatList from "./pages/GroupChatList";
import ChatRoom from "./components/ChatRoom";
import Search from "./pages/Search";
import Trending from "./pages/Trending";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/h/:hashtag/" element={<Hashtags />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/:username/profile" element={<Profile />} />
        <Route path="/:username/friends" element={<Friends />} />
        <Route path="/friend-requests" element={<Requests />} />
        <Route path="/:username/actors" element={<SimilarActors />} />
        <Route path="/:username/settings" element={<Settings />} />
        <Route path="/:username/chatlist" element={<GroupChatList/>} />
        <Route path="/:username/chat/:chatId" element={<ChatRoom/>} />
        <Route path="/search" element={<Search/>} />
        <Route path="/trending" element={<Trending/>} />
        
      </Routes>
    </BrowserRouter>
  )
}

export default App
