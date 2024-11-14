import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config.json';
import Cookies from 'js-cookie';
import { useParams } from 'react-router-dom';
import SideNav from '../components/SideNav';
import UserComponent from '../components/UserComponent';
import PostComponent from '../components/PostComponent';


export default function Search() { 
    const user = Cookies.get('username');
    // const { username } = useParams();

    const [question, setQuestion] = useState('');
    const[searchRes, setSearchRes] = useState([]);
    
    
    const rootURL = config.serverRootURL;


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${rootURL}/search`, {
                question
            });

            if (response.status === 200) {
                setSearchRes(response.data.results.map(item => item.id));
                console.log(response.data.results.map(item => item.id));
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            alert('No Results Available');
        }

        
    };

    return (
        <div className='w-screen h-screen flex items-center justify-center'>
            <SideNav username={ user }></SideNav>
            <form onSubmit={handleSubmit} className='ml-28'>
                <div className='rounded-md bg-slate-50 p-6 space-y-2 w-full text-black'>
                    <div className='font-bold flex w-full justify-center text-2xl mb-4'>
                        Search
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="username" className='font-semibold'>Question</label>
                        <input
                            id="username"
                            type="text"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                    </div>
                    <div className='w-full flex justify-center'>
                        <button type="submit" className='px-4 py-2 mt-2 rounded-md bg-emerald-700 outline-none font-bold text-white'>
                            Search
                        </button>
                    </div>
                </div>
            </form>
            <div className='w-full h-full justify-center text-black ml-4 overflow-y-auto z-10 my-10 py-10'>
               {searchRes.length > 0 && (searchRes.map((id, index) => (
                <div key={index}>
                    {id.includes('user') && 
                        <UserComponent key={index} user={id.split('-')[1]} parent={user} activeTab={'followers'} number={searchRes.length} self={id.split('-')[0] === user}></UserComponent>
                    }
                    {id.includes('post') &&
                        <PostComponent key={index} post_id={id.split('-')[1]}></PostComponent>
                    }
                </div>
                ))
                )} 
            </div>
        </div>
    );
    
        
}