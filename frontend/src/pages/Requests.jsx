// import {useState, useEffect} from 'react';
// import { useParams } from 'react-router-dom';
// import axios from 'axios'; 
// import config from '../../config.json';
// import { useNavigate } from 'react-router-dom';
// import RequestComponent from '../components/RequestComponent';
// import Cookies from 'js-cookie';
// import SideNav from '../components/SideNav';
// import UserComponent from '../components/UserComponent';


// export default function Requests() {
//     const navigate = useNavigate(); 
//     // const { username } = useParams();
//     const rootURL = config.serverRootURL;
//     var username = Cookies.get('username');
    
//     const [requests, setRequests] = useState([]);
//     const [recommendations, setRecommendations] = useState([]);

//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 var response = await axios.get(`${rootURL}/${username}/requests`);
//                 setRequests(response.data.results);
//                 response = await axios.post(`${rootURL}/friendsOfFriends/${username}`);
//                 console.log(`${rootURL}/friendsOfFriends/${username}`);
//                 console.log(response.data);
//                 setRecommendations(response.data);
//             } catch (error) {
//                 console.error('Error fetching data:', error);
//             }
//         };

//         fetchData();
        
//     }, [requests]);

//     return (
//         <div className='w-screen h-screen flex flex-col text-black'>
//             <SideNav username={username}></SideNav>
//             <div className='ml-20 p-0 space-y-2 bg-white fixed top-0 z-10 flex-row w-1/2'>
//                 <div className='flex w-full justify-center text-3xl text-black'>
//                     <div
//                             className='w-1/2 pt-6 pb-6 font-semibold'
//                         >
//                             Friend Requests
//                     </div>
//                 </div>
//                 <div className='pt-2'> {/* Adjust padding top to accommodate the fixed top buttons */}
//                     <div className='flex flex-col w-full'>
//                         <ul>
//                             {requests.map((request, index) => (
//                                 <RequestComponent key={index} person={request.person} requester={request.requester}/>
//                             ))} 
//                         </ul>
//                     </div>
//                 </div>
//                 <div className='ml-20 p-0 space-y-2 w-full bg-white fixed top-0 z-10'>
//                     <div className='flex w-full justify-center text-3xl text-black'>
//                         <div
//                                 className='w-1/2 pt-6 pb-6 font-semibold'
//                             >
//                                 Friend Recommendations
//                         </div>
//                     </div>
//                     <div className='pt-2'> {/* Adjust padding top to accommodate the fixed top buttons */}
//                         <div className='flex flex-col w-full'>
//                             <ul>
//                                 {recommendations.map((rec, index) => (
//                                     <UserComponent key={index} user={rec} parent={username} activeTab={'followers'} number={recommendations.length} self={false}/>
//                                 ))} 
//                             </ul>
//                         </div>
//                     </div>
                    
//                 </div>
//             </div>
            
//         </div>
//     )
// }

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import UserComponent from '../components/UserComponent';
import Cookies from 'js-cookie';
import SideNav from '../components/SideNav';
import RequestComponent from '../components/RequestComponent';


export default function Requests() {
    const navigate = useNavigate();

    const rootURL = config.serverRootURL;
    var username = Cookies.get('username');
    
    const [requests, setRequests] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [activeTab, setActiveTab] = useState(Cookies.get('activeTab') === 'followers' ? 'followers' : 'following'); // Default tab

    useEffect(() => {
        const fetchData = async () => {
            try {
                var response = await axios.get(`${rootURL}/${username}/requests`);
                setRequests(response.data.results);
                response = await axios.post(`${rootURL}/friendsOfFriends/${username}`);
                console.log(`${rootURL}/friendsOfFriends/${username}`);
                console.log(response.data);
                setRecommendations(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();

    }, [requests, recommendations, username]);

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
                            className={`w-1/2 pt-6 pb-6 focus:outline-none rounded-none ${activeTab === 'requests' ? 'border-r border-l border-t border-gray-400 group border-t-0 border-r-0 border-l-0 bg-white hover:border-gray-400' : 'border-r border-l border-t group border-t-0 border-r-0 border-l-0  bg-white hover:border-white'} hover:bg-gray-50`}
                            onClick={() => handleTabChange('requests')}
                        >
                            Requests
                        </button>
                        <button
                            className={`w-1/2 pt-6 pb-6 focus:outline-none rounded-none ${activeTab === 'recommendations' ? 'border-r border-l border-t border-gray-400 group border-t-0 border-r-0 border-l-0 bg-white hover:border-gray-400' : 'border-r border-l border-t group border-t-0 border-r-0 border-l-0 bg-white hover:border-white'} hover:bg-gray-50`}
                            onClick={() => handleTabChange('recommendations')}
                        >
                            Recommendations
                        </button>
                    </div>
                </div>
                <div className='pt-20'> {/* Adjust padding top to accommodate the fixed top buttons */}
                    <div className='flex flex-col w-full'>
                        <ul>
                            {activeTab === 'requests' && (
                                requests.map((request, index) => (
                                    <RequestComponent key={index} person={request.person} requester={request.requester}/>
                                ))
                            )}
                            {activeTab === 'recommendations' && (
                                recommendations.map((following, index) => (
                                    <UserComponent key={index} user={following} parent={username} activeTab={activeTab} number={recommendations.length} self={false} />
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
