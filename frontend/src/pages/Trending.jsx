import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import PostComponent from '../components/PostComponent';
import CreatePostComponent from '../components/CreatePostComponent';
import Cookies from 'js-cookie';
import SideNav from '../components/SideNav';

export default function Feed() {
  const navigate = useNavigate();
  const rootURL = config.serverRootURL;
  var username = Cookies.get('username');
  const [posts, setPosts] = useState([]);
  const limit = 10;
  const [offset, setOffset] = useState(0);


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const response = await axios.post(`${rootURL}/trending`);
    console.log(response.data);
    setPosts(response.data);
    console.log(posts);

  }


  return (
    <div className='w-full h-full'>
      <SideNav username={username}></SideNav>
      <div className="w-full flex flex-col justify-center">
            {/*Put the scroll bar always on the bottom*/}
            <div className="w-full flex flex-col justify-center py-10"> {/* Added wrapper div */}

                {posts.map((post, index) => (
                    <PostComponent key={index} post_id={post}/>
                ))}
            
            </div>
        </div>
    </div>
  );
}