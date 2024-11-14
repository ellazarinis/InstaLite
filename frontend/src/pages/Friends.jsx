import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import UserComponent from '../components/UserComponent';
import Cookies from 'js-cookie';
import SideNav from '../components/SideNav';


export default function Friends() {
    const navigate = useNavigate();
    const { username } = useParams();
    const rootURL = config.serverRootURL;
    var requester = Cookies.get('username');

    const [friends, setFriends] = useState([]);
    // const [following, setFollowing] = useState([]);
    // const [activeTab, setActiveTab] = useState(Cookies.get('activeTab') === 'followers' ? 'followers' : 'following'); // Default tab

    var self = false;
    if (requester == username) {
        self = true;
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${rootURL}/${username}/friends`);

                setFriends(response.data.results.friends);
                // setFollowing(response.data.results.following);

            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();

    }, [followers, following, username]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    return (
        <div className='w-full h-full flex flex-col'>
            <div>
                <SideNav username={username}></SideNav>
            </div>
            
            <div className='w-full h-screen flex flex-col text-black pl-20'>
                <div className='p-0 space-y-2 w-full bg-white fixed top-0 z-10'>
                    <div className='flex w-full justify-center text-xl text-black'>
                        <button
                            className={`w-1/2 pt-6 pb-6 focus:outline-none rounded-none ${activeTab === 'followers' ? 'border-r border-l border-t border-gray-400 group border-t-0 border-r-0 border-l-0 bg-white hover:border-gray-400' : 'border-r border-l border-t group border-t-0 border-r-0 border-l-0  bg-white hover:border-white'} hover:bg-gray-50`}
                            onClick={() => handleTabChange('followers')}
                        >
                            Followers
                        </button>
                        <button
                            className={`w-1/2 pt-6 pb-6 focus:outline-none rounded-none ${activeTab === 'following' ? 'border-r border-l border-t border-gray-400 group border-t-0 border-r-0 border-l-0 bg-white hover:border-gray-400' : 'border-r border-l border-t group border-t-0 border-r-0 border-l-0 bg-white hover:border-white'} hover:bg-gray-50`}
                            onClick={() => handleTabChange('following')}
                        >
                            Following
                        </button>
                    </div>
                </div>
                <div className='pt-20'> {/* Adjust padding top to accommodate the fixed top buttons */}
                    <div className='flex flex-col w-full'>
                        <ul>
                            {activeTab === 'followers' && (
                                followers.map((follower, index) => (
                                    <UserComponent key={index} user={follower} parent={username} activeTab={activeTab} number={followers.length} self={self}/>
                                ))
                            )}
                            {activeTab === 'following' && (
                                following.map((following, index) => (
                                    <UserComponent key={index} user={following} parent={username} activeTab={activeTab} number={following.length}self={self} />
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
