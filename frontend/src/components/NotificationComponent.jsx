import {useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
const NotificationComponent = ({ inviter }) => {
    const navigate = useNavigate(); 
    const rootURL = config.serverRootURL;
    var invitee = Cookies.get('username');
    const [profilePic, setProfilePic] = useState('');
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                inviter = inviter.includes(':') ? inviter.split(':')[0] : inviter;
                const response = await axios.get(`${rootURL}/${inviter}/userdata`);
                setProfilePic(response.data.results.profile_pic);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
        
    }, [inviter]);
        
    const profileNav = () => {
        navigate('/' + inviter + '/profile');
    };

    const reject = async (event) => {
        event.stopPropagation();
        try {
            await axios.post(`${rootURL}/reject-chat-invite/${invitee}/${inviter}`);
            setIsVisible(false);
        } catch (error) {
            console.error('Error accepting chat invitation:', error);
        }
    };

    const accept = async (event) => {
        event.stopPropagation(); 
        try {
            await axios.post(`${rootURL}/accept-chat-invite/${invitee}/${inviter}`);
            setIsVisible(false);
        } catch (error) {
            console.error('Error accepting chat invitation:', error);
        }
    };

    if (!isVisible) {
        return null; 
    }

    return (
        <div onClick={profileNav} className='flex w-full items-center text-black hover:bg-gray-50 border-b-2 border-gray-50'>
            {profilePic && (
                <img
                    src={profilePic}
                    alt={`${inviter.includes(':') ? inviter.split(':')[0] : inviter}'s profile`}
                    className="rounded-full w-10 h-10 mr-4"
                    onError={(e) => {
                        e.target.src = 'https://t3.ftcdn.net/jpg/03/58/90/78/360_F_358907879_Vdu96gF4XVhjCZxN2kCG0THTsSQi8IhT.jpg'; // Fallback to default photo on error
                    }}
                />
            )}
            { inviter.includes(':') ? inviter.split(':')[0] : inviter } has invited you to chat{ inviter.includes(':') ? ' in group ' + inviter.split(':')[1] + "!" : '!' }
            {
                <div className="left-0 ml-auto">
                    <button onClick={accept} className="bg-green-400 hover:bg-green-500 text-white font-bold py-2 px-4 rounded">Accept</button>
                    <button onClick={reject} className="bg-red-400 hover:bg-red-500 text-white font-bold py-2 px-4 rounded">Reject</button>
                </div>
            }
        </div>
    );
}

export default NotificationComponent;