import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import PostComponent from '../components/PostComponent';
import CreatePostComponent from '../components/CreatePostComponent';
import Cookies from 'js-cookie';
import SideNav from '../components/SideNav';
import InfiniteScroll from 'react-infinite-scroll-component';

export default function Feed() {
  const navigate = useNavigate();
  const rootURL = config.serverRootURL;
  var username = Cookies.get('username');
  const [posts, setPosts] = useState([]);
  const limit = 10;
  const [offset, setOffset] = useState(0);


  useEffect(() => {
    const handleWindowBlur = () => {
      setOffline();
    };

    const handleWindowFocus = () => {
      setOnline();
    };

    const fetchData = async () => {
      const response = await axios.get(`${rootURL}/feed/${limit}/${offset}`);
      setPosts(response.data.results.map(result => result.post_id));
    }

    const interval = setInterval(() => {
      setOffset(0);
      setPosts([]);
      axios.get(`${rootURL}/feed/${limit}/${offset}`)
        .then(res => setPosts(res.data.results.map(result => result.post_id)))
        .catch(err => console.error(err));
      console.log("heyyy");
    }, 3600000);
    // console.log("hello");

    if (!username) {
      navigate('/login');
    } else {
      fetchData();
      setOnline();
      window.onblur = handleWindowBlur;
      window.onfocus = handleWindowFocus;
      
      return () => {
        window.onblur = null;
        window.onfocus = null;
        clearInterval(interval);
      };
    }
  }, []);
  
  const setOnline = async () => {
    try {
      const response = await axios.post(`${rootURL}/setonline/${username}`);
    } catch (error) {
      console.error('Error setting user online:', error);
    }
  };
  
  const setOffline = async () => {
    try {
      const response = await axios.post(`${rootURL}/setoffline/${username}`);
    } catch (error) {
      console.error('Error setting user offline:', error);
    }
  };

  const fetchMoreData = async () => {
    try {
      const response = await axios.get(`${rootURL}/feed/${limit}/${offset + limit}`);
      setOffset(offset + limit);
      const addPosts = response.data.results.map(result => result.post_id)
      console.log(addPosts);
      setPosts([...posts, ...addPosts]);
    } catch (error) {
      console.error('Failed to fetch file content:', error);
    }
  };


  return (
    <div className='w-full h-full'>
      <SideNav username={username}></SideNav>
      <div className="w-full flex flex-col justify-center">
            <CreatePostComponent/>
            {/*Put the scroll bar always on the bottom*/}
            <div className="w-full flex justify-center py-10"> {/* Added wrapper div */}

            <InfiniteScroll
              dataLength={posts.length}
              next={() => fetchMoreData()}
              hasMore={true}
              loader={<h4>Loading...</h4>}
            >
            {posts.map((post, index) => (
              <PostComponent key={index} post_id={post}/>
            ))}
            </InfiniteScroll>
            </div>
          </div>
        {/* <CreatePostComponent /> */}
        
        {/* <PostComponent post_id={116} />
        <PostComponent post_id={1} />
        <PostComponent post_id={3} /> */}
      {/* </div> */}
    </div>
  );
}