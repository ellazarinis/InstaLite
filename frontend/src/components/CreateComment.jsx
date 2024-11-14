import React, { useState } from 'react';
import axios from 'axios';
import config from '../../config.json';
import Cookies from 'js-cookie';

function CreateComment({ on_post }) {
  const [content, setContent] = useState('');
  const username = Cookies.get('username');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
        const response = await axios.post(
            `${config.serverRootURL}/${username}/addComment/${on_post}`,
            {
            content
            }
        );
        if (response.status === 201 || response.status === 200) {
          setContent('');
        }
    } catch (error) {
      console.error('Error commenting:', error);
    }
  };

  return (
    <div className="flex">
      <form>
        <div className="rounded-md bg-white text-black p-6 space-y-2 pl-0 pt-0 pb-0 w-[570px]">
            <div className='flex items-center justify-between'>
            <textarea
              value={content}
              placeholder="Write a comment..."
              onChange={(e) => setContent(e.target.value)}
              className="border bg-slate-50 border-gray-500 p-2 rounded-md mb-2 w-full outline-none"
              rows={1}
              required
            ></textarea>
                    <div className="outfit-regular">
            <button
              type="button"
              className="rounded-md bg-white text-lg outline-none font-bold p-0 pl-4 m-0 text-black hover:border-0 border-0"
              onClick={handleSubmit}
            >
              Comment
            </button>
          </div>
          </div> 
          </div>            
      </form>
    </div>
  );
}

export default CreateComment;