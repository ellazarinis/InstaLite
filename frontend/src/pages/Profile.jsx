import {useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import SideNav from '../components/SideNav';
import NotificationComponent from '../components/NotificationComponent';
import PostComponent from '../components/PostComponent';
import UserComponent from '../components/UserComponent';


// function Follow({ status }) {
//     if (status = 'following') {
//       return <div>Following</div>>;
//     }
//     return <li className="item">{name}</li>;
//   }

export default function Profile() {
    const navigate = useNavigate(); 
    const { username } = useParams();
    const rootURL = config.serverRootURL;
    const [notifications, setNotifications] = useState([]);
    const user = Cookies.get('username');

    const [onlineUser, setOnlineUser] = useState(false);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${rootURL}/notifications/${Cookies.get('username')}`);
                if (response.status === 200) {
                    setNotifications(response.data.notifications);
                } else {
                    setNotifications([]);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
        
        fetchData();
    }, [notifications, username]);

    var requester = Cookies.get('username');
    useEffect(() => {
        const handleWindowBlur = () => {
          setOffline();
        };
    
        const handleWindowFocus = () => {
          setOnline();
        };
    

        const getOnline = async () => {
            try {
              const response = await axios.get(`${rootURL}/getonline/${username}`);
              if (response.status === 201) {
                setOnlineUser(true);
              } else {
                setOnlineUser(false);
              }
            } catch (error) {
              console.error('Error setting user online:', error);
            }
        };

        if (!requester) {
          navigate('/login');
        } else {
          setOnline();
          getOnline();
          window.onblur = handleWindowBlur;
          window.onfocus = handleWindowFocus;
          return () => {
            window.onblur = null;
            window.onfocus = null;
          };
        }
      }, []);
      
      const setOnline = async () => {
        try {
          await axios.post(`${rootURL}/setonline/${requester}`);
        } catch (error) {
          console.error('Error setting user online:', error);
        }
      };

      const setOffline = async () => {
        try {
          await axios.post(`${rootURL}/setoffline/${requester}`);
        } catch (error) {
          console.error('Error setting user offline:', error);
        }
    };

    const [hashtags, setHashtags] = useState([]);
    const [profilePic, setProfilePic] = useState('');
    const [followers, setFollowers] = useState(0);
    const [following, setFollowing] = useState(0);
    const [numPosts, setNumPosts] = useState(0);
    const [linkedNconst, setLinkedNconst] = useState('');
    const [bio, setBio] = useState('');
    const [posts, setPosts] = useState([]);
    const [followStatus, setFollowStatus] = useState('');
    const [friends, setFriends] = useState([]);

    var self = false;
    if (requester == username) {
        self = true;
    }

    useEffect(() => {
        const fetchData = async () => {
            if (!Cookies.get('username')) {
                alert('Not logged in');
            }
            try {
                const response = await axios.get(`${rootURL}/${username}/profile`);
                setHashtags(response.data.results.hashtags.slice(1, -1).split(', ').map(item => item.trim()));
                setProfilePic(response.data.results.profile_pic);
                setFollowers(response.data.results.num_followers);
                setFollowing(response.data.results.num_following);
                setNumPosts(response.data.results.num_posts);
                setLinkedNconst(response.data.results.linked_nconst);
                setBio(response.data.results.bio);
                const postResponse = await axios.get(`${rootURL}/${username}/posts`);
                const postRes = postResponse.data.results.map(result => result.post_id);
                setPosts(postRes);
                // console.log(self);
                if (!self) {
                    // console.log('requester: ' + requester);
                    // console.log('username: ' + username);
                    const statusResponse = await axios.get(`${rootURL}/${username}/${requester}/request-status`);
                    setFollowStatus(statusResponse.data.status);
                }

                const friendResponse = await axios.get(`${rootURL}/${username}/friends`);
                const friendsRes = friendResponse.data.results.friends;
                setFriends(friendsRes);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
        
    }, [username, friends]);

    const postNav = (post_id) => {
        navigate('/' + post_id);
    };

    const settings = () => {
        navigate('/' + username + '/settings');
    };

    const followersNav = () => {
        navigate('/' + username + '/friends');
        Cookies.set('activeTab', 'followers');
    };

    const followingNav = () => {
        navigate('/' + username + '/friends');
        Cookies.set('activeTab', 'following');
    };

    const request = async () => {
        if (followStatus == 'Follow') {
            try {
                await axios.post(`${rootURL}/send-request`, { person: username, requester: Cookies.get('username')});
                setFollowStatus('Requested');
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
    }

    const inviteToChat = async () => {
        try {
            await axios.post(`${rootURL}/invite-to-chat`, { person: username, requester: Cookies.get('username')});
            alert('Invitation sent');
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }


    return (
        <div className='w-full h-full flex items-center justify-center text-black'>
            <SideNav username={ user }></SideNav>
            <div className='p-6 mt-10 space-y-2 w-[700px]'>
                <div className='flex w-full justify-center text-med mb-4 text-black'>
                    <img src={ profilePic } className='w-32 h-32 rounded-full object-cover object-center' alt='profile'
                        onError={(e) => {
                            e.target.src = 'https://t3.ftcdn.net/jpg/03/58/90/78/360_F_358907879_Vdu96gF4XVhjCZxN2kCG0THTsSQi8IhT.jpg'; // Fallback to default photo on error
                        }} />
                </div>
                <div className='font-bold flex w-full justify-center text-2xl mb-4 text-black'>
                    { username }
                </div>
                <div className='flex w-full justify-center text-l my-4 py-2 text-black'>
                    <div className="py-2 mx-4"> { numPosts } posts </div> 
                    <div className="py-2 mx-4"> { followers } friends </div> 
                    {/* <button type='button' className="bg-slate-200 py-2 mx-2" onClick={followingNav} > { following } following </button> */}
                </div>
                <div className='flex w-full justify-center text-l mb-4 text-black'>
                    {self && <button type='button' className="px-4 py-2 rounded-md bg-emerald-700 outline-none text-white" onClick={settings}>Edit Profile</button>}
                    {!self && <button type='button' className="px-4 py-2 rounded-md bg-emerald-700 outline-none text-white" onClick={request}> { followStatus } </button>}
                    &nbsp;
                    {!self && onlineUser && <button type='button' className="px-4 py-2 rounded-md bg-emerald-700 outline-none text-white" onClick={inviteToChat}>Invite to Chat</button>}
                </div>
                <div className='flex w-full justify-center text-l mb-4 text-black'>
                    { bio }
                </div>
                <div className='flex w-full justify-center text-gray-400'>
                    {(hashtags) &&  hashtags.map((hashtag, index) => (
                        <button key={index} type='button' className='font-semibold text-base bg-white' onClick={() => hashtagNav(hashtag)}> { hashtag } </button>
                    )) }
                </div>
                {/* <div className='flex w-full justify-center text-l mb-4 text-black'>
                    { hashtags.map((tag, index) => (
                        <div key={index}> { tag } </div>
                    ))}
                </div> */}
                {username === Cookies.get('username') && notifications.length > 0 && (
                <div className="flex justify-center border-l-2 border-gray-300 p-4 w-full">
                    <div className='w-2/3'>
                        <b className="flex border-b-2 border-gray-300 p-0 m-0">Notifications</b>
                            {notifications.map((inviter) => (
                            <div key={inviter}>
                                <br />
                                <NotificationComponent inviter={inviter} />
                            </div>
                        ))}
                    </div>
                </div>)}

                <div className="w-full flex flex-col justify-center">
                    <div className="w-full justify-center">
                        {posts.map((post, index) => (
                            <PostComponent key={index} post_id={post}/>
                        ))}
                    </div>
                </div>
            </div>
            <div className='h-full flex flex-col top-0 self-start justify-center mt-16'>
                <div className='text-xl font-semibold justify-center self-center mb-2'>{username}'s Friends</div>
                <div className='flex flex-col w-full'>
                    <ul>
                        {friends.map((friend, index) => (
                                <UserComponent key={index} user={friend} parent={username} activeTab={null} number={friends.length} self={self}/>
                            ))
                        }
                    </ul>
                </div>
            </div>
            
        </div>
    )
}