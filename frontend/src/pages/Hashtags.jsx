import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import PostComponent from '../components/PostComponent';
import Cookies from 'js-cookie';
import SideNav from '../components/SideNav';

export default function Hashtags() {
    // call an axios call to get all the posts with the hashtag
    const navigate = useNavigate();
    const { hashtag } = useParams();
    const rootURL = config.serverRootURL;
    var username = Cookies.get('username');

    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${rootURL}/h/${hashtag}`);
                setPosts(response.data.posts);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();

    }, [hashtag, posts]);

    return (
        <div className='w-full h-full flex flex-col'>
            <div>
                <SideNav username={username}></SideNav>
            </div>
            {posts.map((post) => ( 
                <PostComponent post_id={post.post_id} />
            ))}
        </div>
    );
}