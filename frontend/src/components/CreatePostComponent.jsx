import React, { useState } from 'react';
import axios from 'axios';
import config from '../../config.json';
import { useParams } from 'react-router-dom';
import Cookies from 'js-cookie';

function CreatePostComponent() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [contentType, setContentType] = useState('text');
  const [file, setFile] = useState(null);
  const username = Cookies.get('username');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(
        `${config.serverRootURL}/${username}/createPost`,
        {
          title,
          content,
          parent_id: null,
          hashtags,
          content_type: contentType,
        }
      );
      if (response.status === 201 || response.status === 200) {
        // Update posts
        if (contentType === 'image') {
          try {
            const fd = new FormData();
            fd.append("image", file);
            const imageResponse = await axios.post(`${config.serverRootURL}/savepost/${response.data.post_id}`, fd);
            if ((imageResponse.status !== 200 && imageResponse.status !== 201)) {
                console.log("Image Upload Error: ", err);
                const response2 = await axios.post(`${config.serverRootURL}/deleteInvalidPost/${response.data.post_id}`);
                alert('Upload failed');
            } else {
              console.log(response.data.post_id);
              const response2 = await axios.post(`${config.serverRootURL}/updatePostLink/${response.data.post_id}`);
              // Clear input fields
              setTitle('')
              setContent('');
              setHashtags('');
              setContentType('text');
              setFile('');
            }
          } catch(err) {
              await axios.post(`${config.serverRootURL}/deleteInvalidPost/${response.data.post_id}`);
              alert('Image Upload Failed');
          }
        } else {
          // Clear input fields
          setTitle('')
          setContent('');
          setHashtags('');
          setContentType('text');
        }
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <div className="flex justify-center pt-10">
      <form>
        <div className="rounded-md bg-white text-black p-6 space-y-2 w-full border-gray-300 border-2 shadow-lg w-[700px] h-[530px]">
          <div className="font-bold flex w-full justify-center text-4xl outfit-regular mb-4">
            What's your story, {username}?
          </div>
          <br></br>
          <div className="flex w-full text-black text-xl justify-between">
                <label htmlFor="text" className='flex'>
                  <input
                    className="form-radio w-5 h-5 accent-red-300"
                    type="radio"
                    id="text"
                    name="contentType"
                    value="text"
                    checked={contentType === "text"}
                    onChange={(e) => setContentType(e.target.value)}
                  />
                  &nbsp;Text
                </label>
                <label htmlFor="image" className='flex'>
                  <input
                    className="form-radio w-5 h-5 accent-red-300"
                    type="radio"
                    id="image"
                    name="contentType"
                    value="image"
                    checked={contentType === "image"}
                    onChange={(e) => setContentType(e.target.value)}
                  />
                  &nbsp;Image
                </label>
                <label htmlFor="html" className='flex'>
                  <input
                    className="form-radio w-5 h-5 accent-red-300"
                    type="radio"
                    id="html"
                    name="contentType"
                    value="html"
                    checked={contentType === "html"}
                    onChange={(e) => setContentType(e.target.value)}
                  />
                  &nbsp;HTML-Embedded Text
                </label>
          </div>
          <br></br>
          { contentType === 'image' &&
          <div className="flex-col text-xl items-center justify-between">
            <label htmlFor="title" className="font-semibold">
              Title
            </label>
            <br></br>
            <input
              id="title"
              type="text"
              className="bg-slate-50 rounded-md border border-gray-500 p-2 w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          }
          <div className="flex-col text-xl">
          { contentType !== 'image' ?
            <div className='flex-col items-center justify-between'><label htmlFor="content" className="font-semibold">
              Content
            </label>
            <br></br>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="border bg-slate-50 border-gray-500 p-2 rounded-md mb-2 w-full"
              rows={4}
              required
            ></textarea></div> : 
            <div className='flex-col tems-center justify-between'>
              <label htmlFor="image" className='font-semibold'>Image Upload</label>
              <br></br>
              <input
                  name="image"
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className='bg-slate-50 rounded-md border border-gray-500 p-2 w-full'
              />
            </div>}
          </div>
          <div className="flex-col items-center justify-between text-xl">
            <label htmlFor="hashtags" className="font-semibold">
              Hashtags
            </label>
            <br></br>
            <input
              id="hashtags"
              type="text"
              className="bg-slate-50 rounded-md border border-gray-500 p-2 w-full"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
            />
          </div>
          <div className="w-full flex justify-center pt-2">
            <button
              type="button"
              className="px-4 py-2 mt-2 text-l rounded-md bg-emerald-700 outline-none font-semibold text-white"
              onClick={handleSubmit}
            >
              Create Post
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CreatePostComponent;