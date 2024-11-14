import {useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import feedIcon from '../assets/feed-icon.svg';
import requestsIcon from '../assets/requests-icon.svg';
import profileIcon from '../assets/profile-icon.svg';
import searchIcon from '../assets/search-icon.svg';
import chatIcon from '../assets/chat-icon.svg';
import trendingIcon from '../assets/trending-icon.svg';

export default function SideNav({username}) {
    const navigate = useNavigate(); 
    const rootURL = config.serverRootURL;

    const trendingNav = () => {
        navigate('/trending');
    };

    const feedNav = () => {
        navigate('/');
    };

    const requestsNav = () => {
        navigate('/friend-requests');
    };

    const chatsNav = () => {
        navigate('/' + username + '/chatList');
    };

    const searchNav = () => {
        navigate('/search');
    };

    const profileNav = () => {
        navigate('/' + username + '/profile');
    };

    return (
        <div className='h-full w-20 fixed z-10 top-0 left-0 outline bg-emerald-600 overflow-x-hidden pt-5 flex flex-col items-center justify-center text-white min-w-16 drop-shadow-lg'>
            <img src={feedIcon} alt="Feed" onClick={feedNav} className='w-16 my-4 p-2 hover:bg-emerald-500'/>
            <img src={trendingIcon} alt="Trending" onClick={trendingNav} className='w-16 my-4 p-2 hover:bg-emerald-500'/> 
            <img src={chatIcon} alt="Chats"  onClick={chatsNav} className='w-16 my-4 p-2 hover:bg-emerald-500'/>
            <img src={requestsIcon} alt="Requests"  onClick={requestsNav} className='w-16 my-4 p-2 hover:bg-emerald-500'/>
            <img src={searchIcon} alt="Search"  onClick={searchNav} className='w-16 my-4 p-2 hover:bg-emerald-500'/>
            <img src={profileIcon} alt="Profile"  onClick={profileNav} className='w-16 my-4 p-2 hover:bg-emerald-500'/>

        </div>
        
    );
}