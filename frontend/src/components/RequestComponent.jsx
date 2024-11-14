import {useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';


export default function RequestComponent({person, requester}) {
    const navigate = useNavigate(); 
    const [profilePic, setProfilePic] = useState('');
    const rootURL = config.serverRootURL;
    var username = Cookies.get('username');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${rootURL}/${username}/userdata`);
                setProfilePic(response.data.results.profile_pic);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);

    const deleteRequest = async (accept) => {
        try {
            const response = await axios.post(`${rootURL}/delete-friend-request`, {
                person,
                requester,
                accept
            });
            if (response.status === 200) {
                navigate('/friend-requests');
                return;
            }
        } catch (error) {
            alert("Request failed.");
            return;
        }
    };

    const profile = (username) => {
        navigate("/" + username + "/profile");
    };

    return (
        <div onClick={() => profile(requester)} className='flex w-full items-center text-black hover:bg-gray-50 border-b-2 border-gray-50'>
        {profilePic && (
            <img
                src={profilePic}
                alt={`${requester}'s profile`}
                className="rounded-full w-10 h-10 m-4 ml-10"
                onError={(e) => {
                    e.target.src = 'https://t3.ftcdn.net/jpg/03/58/90/78/360_F_358907879_Vdu96gF4XVhjCZxN2kCG0THTsSQi8IhT.jpg'; // Fallback to default photo on error
                }}
            />
        )}
        <li>{requester}</li>
        <button onClick={() => deleteRequest(true)} className="ml-auto mr-10 bg-red-400 hover:bg-red-500 text-white font-bold py-2 px-4 rounded">Accept</button>
        <button onClick={() => deleteRequest(false)} className="ml-auto mr-10 bg-red-400 hover:bg-red-500 text-white font-bold py-2 px-4 rounded">Reject</button>
    </div>
        // <div>
        //     <button type='button' className='text-white' onClick={() => profile(requester)}> {requester} </button>
        //     <button type='button' className='text-white' onClick={() => deleteRequest(true)}> Accept </button>
        //     <button type='button' className='text-white' onClick={() => deleteRequest(false)}> Reject </button>
        // </div>
    )
}