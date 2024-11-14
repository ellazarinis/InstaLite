import {useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import CreateComment from './CreateComment';
import CreateReply from './CreateReply'
const rootURL = config.serverRootURL;

const CommentComponent = ({ author, content, post_id }) => {
    const navigate = useNavigate(); 
    const [likes, setLikes] = useState(0);
    const [liked, setLiked] = useState(false);
    const [triggerHandleLike, setTriggerHandleLike] = useState(false);
    const [comments, setComments] = useState({ comments: [] });
    const [toggle, setToggle] = useState(false);
    const [commentCount, setCommentCount] = useState(0);

    const profile = () => {
        navigate(`/${author}/profile`);
    };

    const handleLike = async () => {
        let updateLikes;
        setTriggerHandleLike(!triggerHandleLike);
        const response2 = await axios.get(`${rootURL}/p/${post_id}/liked/${author}`);
        
        if (response2.status === 201) {
            updateLikes = async () => {
                try {
                    const result = await axios.post(`${rootURL}/p/${post_id}/updateLikes/${author}`, {
                        liked: 1
                    });
                    setLikes(result.data.likes)
                    setLiked(true)
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }
        } else if (response2.status === 200) {
            updateLikes = async () => {
                try {
                    const result = await axios.post(`${rootURL}/p/${post_id}/updateLikes/${author}`, {
                        liked: 0
                    });
                    setLikes(result.data.likes)
                    setLiked(false)
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }
        }
        updateLikes();
    };

    const handleToggle = () => {
        setToggle(prevToggle => !prevToggle);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${rootURL}/p/${post_id}`);
                setLikes(response.data.results.post.likes);
                setComments({ comments: response.data.results.comments });
                setCommentCount(response.data.results.comments ? response.data.results.comments.length : 0);
                const response2 = await axios.get(`${rootURL}/p/${post_id}/liked/${author}`);
                setLiked(response2.status === 200);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, [post_id, author, comments]);

    useEffect(() => {
        setToggle(false);
    }, [commentCount]);

    return (
        <div>     
            <div className='rounded-md bg-slate-100 p-3 flex space-x-2 items-center flex-auto justify-between'>
                <div className='text-black'>
                    <a className='font-semibold text-base' onClick={profile}>{author}</a>&nbsp;
                    {content}
                </div>
                <div className='text-black'>
                    {likes ? likes : 0} likes • <a onClick={handleLike}>{liked ? 'unlike' : 'like'}</a> • <a onClick={handleToggle}>{toggle ? 'cancel reply' : 'reply'}</a>
                </div>
            </div>
            {toggle && (
                <div className='rounded-md bg-white'>
                    <CreateReply on_post={post_id} />
                </div>
            )}
            {comments && comments.comments && (
                <div className="ml-4">
                    {comments.comments.slice(0).reverse().map((comment, index) => (
                        <CommentComponent key={index} author={comment.author} content={comment.content} post_id={comment.post_id} />
                    ))}
                </div>
            )}
        </div>
    );
};

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;

    return `${month}/${day}/${year} at ${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export default function PostComponent({ post_id }) {
    const navigate = useNavigate(); 
    const username = Cookies.get('username');

    const [author, setAuthor] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [likes, setLikes] = useState(0);
    const [postType, setPostType] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [timestamp, setTimestamp] = useState('');
    const [comments, setComments] = useState({ comments: [] });
    const [liked, setLiked] = useState(false);
    const [triggerHandleLike, setTriggerHandleLike] = useState(false);

    const profile = () => {
        navigate(`/${author}/profile`);
    };

    const hashtagNav = (hashtag) => {
        if (hashtag[0] === '#') {
            hashtag = hashtag.substring(1);
        }
        navigate(`/h/${hashtag}`);
    };

    const handleLike = async () => {
        let updateLikes;
        setTriggerHandleLike(!triggerHandleLike);
        const response2 = await axios.get(`${rootURL}/p/${post_id}/liked/${username}`);
        
        if (response2.status === 201) {
            updateLikes = async () => {
                try {
                    const result = await axios.post(`${rootURL}/p/${post_id}/updateLikes/${username}`, {
                        liked: 1
                    });
                    setLikes(result.data.likes)
                    setLiked(true)
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }
        } else if (response2.status === 200) {
            updateLikes = async () => {
                try {
                    const result = await axios.post(`${rootURL}/p/${post_id}/updateLikes/${username}`, {
                        liked: 0
                    });
                    setLikes(result.data.likes)
                    setLiked(false)
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }
        }
        updateLikes();
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${rootURL}/p/${post_id}`);
                setAuthor(response.data.results.post.author);
                setTitle(response.data.results.post.title);
                setContent(response.data.results.post.content);
                setLikes(response.data.results.post.likes);
                setPostType(response.data.results.post.post_type);
                setHashtags(response.data.results.post.hashtags);
                setTimestamp(response.data.results.post.timestamp);
                setComments({ comments: response.data.results.comments });
                const response2 = await axios.get(`${rootURL}/p/${post_id}/liked/${username}`);
                if (response2.status === 200) {
                    setLiked(true)
                } else {
                    setLiked(false)
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, [liked, comments]);

    return (
        <div className="w-[589px] mx-auto pb-16">
            {postType == 'image' ? 
            <div>
                <div className='rounded-md bg-white space-y-2 p-3 w-[589px] border-gray-300 border-2 shadow-lg'>
                    <div className='text-black flex items-center justify-center pt-10'>
                        <div className='w-[512px] h-[526px] overflow-hidden'>
                            <img src={content} className='w-full h-full object-cover object-center' alt='post' />
                        </div>
                    </div>
                    <div className='text-black text-4xl font-bold pt-3 flex items-center justify-center handlee-regular'>
                        { title }
                    </div>
                    <div className='text-gray-400 flex items-center justify-center'>
                            {(hashtags) && (hashtags.split(', ').map((hashtag, index) => (
                                <button key={index} type='button' className='font-semibold text-base bg-white' onClick={() => hashtagNav(hashtag)}> { hashtag } </button>
                            ))) }
                    </div>
                    <div className='text-black flex items-center justify-center'>
                    { likes ? likes : 0 }  likes •<a onClick={handleLike}>&nbsp;{liked ? 'unlike this post' : 'like this post'}</a>
                    </div>
                    <CreateComment on_post={post_id} />
                        <div>
                            <div>
                                { comments && comments.comments ? <div className='rounded-md bg-white'>
                                    <div>
                                        {comments.comments.map((comment) => (
                                            <div>
                                                <CommentComponent author={comment.author} content={comment.content} post_id={comment.post_id} />
                                            </div>
                                        ))}
                                    </div>
                                </div> : ""}
                            </div>
                        </div>
                </div> 
                <div className='flex justify-between'>
                        <div className='text-gray-500 flex items-center'>
                            {formatTimestamp(timestamp)}
                        </div>
                        <div className='text-gray-500 flex items-center'>
                            { <a onClick={profile}> { author } </a> }
                        </div>
                </div>
            </div> : postType == 'text' ? 
                <div>
                    <div className='rounded-md bg-white space-y-2 p-3 w-[589px] border-gray-300 border-2 shadow-lg'>
                        <div className='text-gray-500 flex items-center'>
                            On {formatTimestamp(timestamp)},&nbsp;{ <a onClick={profile}> { author } </a> }&nbsp;wrote:
                        </div>
                        <div className='text-black flex text-2xl'>
                            {content}
                        </div>
                        <div className='text-gray-400'>
                                {(hashtags) && hashtags.split(', ').map((hashtag, index) => (
                                    <button key={index} type='button' className='font-semibold text-base bg-white' onClick={() => hashtagNav(hashtag)}> { hashtag } </button>
                                )) }
                        </div>
                        <div className='text-black'>
                        { likes ? likes : 0 }  likes •<a onClick={handleLike}>&nbsp;{liked ? 'unlike this post' : 'like this post'}</a>
                        </div>
                        <CreateComment on_post={post_id} />
                        <div>
                            <div>
                                { comments && comments.comments ? <div className='rounded-md bg-white'>
                                    <div>
                                        {comments.comments.map((comment) => (
                                            <div>
                                                <CommentComponent author={comment.author} content={comment.content} post_id={comment.post_id} />
                                            </div>
                                        ))}
                                    </div>
                                </div> : ""}
                            </div>
                        </div>
                    </div>
                    <div className='flex justify-between'>
                    </div>
                </div> : postType == 'html' ?
            <div>
                <div>
                    <div className='rounded-md bg-white space-y-2 p-3 w-[589px] border-gray-300 border-2 shadow-lg'>
                        <div className='text-gray-500 flex items-center'>
                            On {formatTimestamp(timestamp)}, { <a onClick={profile}>&nbsp;{ author.includes(":") ? author.split(':')[1] : author } </a> }&nbsp;posted:
                        </div>
                        <div className='text-black flex text-2xl'>
                            <div dangerouslySetInnerHTML={{ __html: content }} style={{ listStyleType: 'disc'}} />
                        </div>
                        <div className='text-gray-400'>
                                {(hashtags) &&  hashtags.split(', ').map((hashtag, index) => (
                                    <button key={index} type='button' className='font-semibold text-base bg-white' onClick={() => hashtagNav(hashtag)}> { hashtag } </button>
                                )) }
                        </div>
                        <div className='text-black'>
                        { likes ? likes : 0 }  likes •<a onClick={handleLike}>&nbsp;{liked ? 'unlike this post' : 'like this post'}</a>
                        </div>
                        <CreateComment on_post={post_id} />
                        <div>
                            <div>
                                { comments && comments.comments ? <div className='rounded-md bg-white'>
                                    <div>
                                        {comments.comments.map((comment) => (
                                            <div>
                                                <CommentComponent author={comment.author} content={comment.content} post_id={comment.post_id} />
                                            </div>
                                        ))}
                                    </div>
                                </div> : ""}
                            </div>
                        </div>
                    </div>
                    <div className='flex justify-between'>
                    </div>
                </div>
            </div>
            : ""
            }
        </div>
    )
  }
  
  /*
                    { postType == 'text' ? content : 
                    // make it a square post 640x640
                    (postType == 'image' ? 
                        <div className='w-[512px] h-[526px] overflow-hidden'>
                            <img src={content} className='w-full h-full object-cover object-center' alt='post' />
                        </div> :
                    (postType == 'html' ? <div dangerouslySetInnerHTML={{ __html: content }} /> : "No content available.")) }



                {<div>
                    {
                        comments.comments.map((comment) => (
                            <CommentComponent author={comment.author} content={comment.content} likes={comment.likes} />
                        ))
                    }
                </div> }
*/