import { useState } from 'react';
import axios from 'axios';
import config from '../../config.json';


const ForgotPassword = () => {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const rootURL = config.serverRootURL;

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the form from submitting traditionally
    try {
      console.log('username:', username);
      const response = await axios.post(`${rootURL}/forgot-password`, { 
        username,
      });
      console.log('username:', username);
      console.log(response);
      setMessage(response.data.message);
      setError('');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setMessage('');
    }
  };

  return (
    <div className='w-screen h-screen flex items-center justify-center'>
      <form onSubmit={handleSubmit}>
        <div className='rounded-md bg-slate-50 p-6 space-y-2 w-full'>
          <div className='font-bold flex w-full justify-center text-2xl mb-4 text-black'>Forgot Password</div>
          <div className='flex space-x-4 items-center justify-between'>
            <label htmlFor="username" className='font-semibold text-black'>Username</label>
            <input 
              id="username" 
              type="text" 
              className='outline-none bg-white rounded-md border border-slate-100 p-2 text-black'
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required
            />
          </div>
          <div className='w-full flex justify-center text-l'>
            <button type="submit" className='px-4 py-2 mt-2 rounded-md bg-emerald-700 outline-none text-white'>
              Submit
            </button>
          </div>
          {message && <p className="mt-4 text-green-500">{message}</p>}
          {error && <p className="mt-4 text-red-500">{error}</p>}
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;