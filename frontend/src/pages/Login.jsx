import { useState } from 'react';
import axios from 'axios';
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';


export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const rootURL = config.serverRootURL;

  const handleLogin = async () => {
    
    try {
      console.log(rootURL);
      const response = await axios.post(`${rootURL}/login`, {
        username,
        password,
      });

      if (response.status === 200) {
        Cookies.set('username', username, { expires: 1/48 });

        navigate(`/${username}/profile`);
      } else {
        alert('Login failed');
      }
    } catch (error) {
      console.log(rootURL);
      console.error('Error logging in user', error);
      alert('Login failed');
    }
  };

  const signup = () => {
    navigate("/signup");
  };

  const forgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <div className='w-screen h-screen flex items-center justify-center'>
      <form>
        <div className='rounded-md bg-slate-50 p-6 space-y-2 w-full'>
          <div className='font-bold flex w-full justify-center text-2xl mb-4 text-black'>
            Log In
          </div>
          <div className='flex space-x-4 items-center justify-between'>
            <label htmlFor="username" className='font-semibold  text-black'>Username</label>
            <input id="username" type="text" className='outline-none bg-white rounded-md border border-slate-100 p-2 text-black'
              value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className='flex space-x-4 items-center justify-between'>
            <label htmlFor="password" className='font-semibold  text-black'>Password</label>
            <input id="password" type="password" className='outline-none bg-white rounded-md border border-slate-100 p-2 text-black'
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className='w-full flex justify-center text-l'>
            <button type="button" className='px-4 py-2 mt-1 mx-1 rounded-md bg-emerald-700 outline-none text-white'
              onClick={handleLogin}>Log in</button>
            <button type="button" className='px-4 py-2 mt-1 mx-1 rounded-md bg-emerald-700 outline-none text-white'
              onClick={signup}>Sign up</button>
          </div>
          <div className='w-full flex justify-center'>
            <a type="button" className='text-emerald-700 underline bg-transparent outline-none'
              onClick={forgotPassword}>Forgot Password?</a>
          </div>
        </div>
      </form>
    </div>
  );
}
