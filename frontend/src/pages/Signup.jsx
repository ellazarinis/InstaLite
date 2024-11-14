import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';

export default function Signup() {
    const navigate = useNavigate(); 

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [bio, setBio] = useState('');
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [hashtagList, setHashtagList] = useState('');
    const [file, setFile] = useState(null);
    const [birthday, setBirthday] = useState('');
    const [affiliation, setAffiliation] = useState('');

    const rootURL = config.serverRootURL;


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        if (email !== confirmEmail) {
            alert('Emails do not match.');
            return;
        }
        
        try {
            const signupResponse = await axios.post(`${rootURL}/signup`, {
                username,
                password,
                email,
                bio,
                hashtagList,
                birthday,
                affiliation
            });


            if (signupResponse.status === 200) {
                try {
                    console.log('reached here 1');
                    const fd = new FormData();
                    fd.append("image", file);
                    console.log('reached here 2');
                    const imageResponse = await axios.post(`${rootURL}/saveimage/${username}`, fd);

                    if (imageResponse.status === 200) {
                        navigate(`/${username}/actors`);
                    } else {
                        console.log("Image Upload Error: ", err);
                        alert('Signup failed');
                        await axios.post(`${rootURL}/dropUser`, { username });
                    }
                } catch(err) {
                    await axios.post(`${rootURL}/dropUser`, { username });
                    alert('Image Upload Failed');
                }
            } else {
                await axios.post(`${rootURL}/dropUser`, { username });
		alert('Signup failed. 2');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed.');
        }

        
    };

    return (
        <div className='w-screen h-screen flex items-center justify-center'>
            <form onSubmit={handleSubmit}>
                <div className='rounded-md bg-slate-50 p-6 space-y-2 w-full text-black'>
                    <div className='font-bold flex w-full justify-center text-2xl mb-4'>
                        Sign Up to Instalite
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="username" className='font-semibold'>Username</label>
                        <input
                            id="username"
                            type="text"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="password" className='font-semibold'>Password</label>
                        <input
                            id="password"
                            type="password"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="confirmPassword" className='font-semibold'>Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="email" className='font-semibold'>Email</label>
                        <input
                            id="email"
                            type="email"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="confirmEmail" className='font-semibold'>Confirm Email</label>
                        <input
                            id="confirmEmail"
                            type="email"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={confirmEmail}
                            onChange={(e) => setConfirmEmail(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="bio" className='font-semibold'>Bio</label>
                        <input
                            id="bio"
                            type="bio"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="hashtagList" className='font-semibold'>hashtagList</label>
                        <input
                            id="hashtagList"
                            type="hashtagList"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={hashtagList}
                            onChange={(e) => setHashtagList(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="birthday" className='font-semibold'>Birthday</label>
                        <input
                            id="birthday"
                            type="date"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="affiliation" className='font-semibold'>Affiliation</label>
                        <input
                            id="affiliation"
                            type="affiliation"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={affiliation}
                            onChange={(e) => setAffiliation(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="image" className='font-semibold'>Profile Picture</label>
                        <input
                            name="image"
                            type="file"
                            onChange={(e) => setFile(e.target.files[0])}
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                        />
                    </div>
                    <div className='w-full flex justify-center'>
                        <button type="submit" className='px-4 py-2 mt-2 rounded-md bg-emerald-700 outline-none font-bold text-white'>
                            Sign up
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
