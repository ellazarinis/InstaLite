import {useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';

// function Follow({ status }) {
//     if (status = 'following') {
//       return <div>Following</div>>;
//     }
//     return <li className="item">{name}</li>;
//   }


const UserComponent = ({ user, parent, activeTab, number, self }) => {
    const navigate = useNavigate(); 
    const rootURL = config.serverRootURL;
    
    const [profilePic, setProfilePic] = useState('');
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${rootURL}/${user}/userdata`);
                setProfilePic(response.data.results.profile_pic);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
        
    }, [number, activeTab, user]);
        
    const profileNav = () => {
        navigate('/' + user + '/profile');
    };

    const removeFollower = async (event) => {
        // event.stopPropagation(); 
        try {
            const response = await axios.post(`${rootURL}/delete-follower`, {
                person: parent,
                follower: user
            });
        } catch (error) {
            console.error('Error removing follower:', error);
        }
    };

    // const removeFollowing = async (event) => {
    //     event.stopPropagation(); 
    //     try {
    //         const response = await axios.post(`${rootURL}/delete-following`, {
    //             person: parent,
    //             following: user
    //         });
    //     } catch (error) {
    //         console.error('Error removing following user:', error);
    //     }
    // };

    return (
        <div onClick={profileNav} className='flex w-full items-center text-black hover:bg-gray-50 border-b-2 border-gray-50'>
            {profilePic && (
                <img
                    src={profilePic}
                    alt={`${user}'s profile`}
                    className="rounded-full w-10 h-10 m-4 ml-4"
                    onError={(e) => {
                        e.target.src = 'https://t3.ftcdn.net/jpg/03/58/90/78/360_F_358907879_Vdu96gF4XVhjCZxN2kCG0THTsSQi8IhT.jpg'; // Fallback to default photo on error
                    }}
                />
            )}
            {!profilePic && (
                 <img
                 src={'https://t3.ftcdn.net/jpg/03/58/90/78/360_F_358907879_Vdu96gF4XVhjCZxN2kCG0THTsSQi8IhT.jpg'}
                 alt={`${user}'s profile`}
                 className="rounded-full w-10 h-10 m-4 ml-4"
             />
            )}
            <li>{user}</li>
            {
                self && <button onClick={() => removeFollower()} className="ml-6 mr-10 bg-red-400 hover:bg-red-500 text-white font-bold py-2 px-4 rounded">Remove</button>
            }
            
        </div>
    );
}

export default UserComponent;