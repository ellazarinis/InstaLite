import {useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import SideNav from '../components/SideNav';

export default function Settings() {
    const navigate = useNavigate();
    const { username } = useParams();
    const rootURL = config.serverRootURL;

    const [email, setEmail] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [linked_nconst, setLinkedNconst] = useState('');
    const [newActor, setNewActor] = useState('');
    const [newHashtags, setNewHashtags] = useState('');
    const [hashtags, setHashtags] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectedActor, setSelectedActor] = useState('');
    const [actors, setActors] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${rootURL}/${username}/profile`);
                setEmail(response.data.results.email);
                setPassword(response.data.results.hashed_password);
                setLinkedNconst(response.data.results.linked_nconst);
                // setNewActor(linked_nconst);
                setHashtags(response.data.results.hashtags.slice(1, -1).split(', ').map(item => item.trim()));
                if (!linked_nconst) {
                    setLinkedNconst("");
                    setSelectedActor("");
                }
                fetchActors(username);
                setSelectedActor(response.data.results.linked_nconst);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
        
    }, [newHashtags, newActor]);

    const confirmChanges = async (type, e) => {
        // e.preventDefault();
        var newTagsString;
        if (type == 'email') {
            setNewPassword(null);
            setNewHashtags(null);
            setNewActor(null);
        } else if (type == 'password') {
            if (newPassword !== confirmPassword) {
                alert('Passwords do not match.');
                return;
            } 
            // else if (newPassword == password) {

            // }
            setNewEmail(null);
            setNewHashtags(null);
            setNewActor(null);
        } else if (type == 'hashtags') {
            // HANDLE
            if (newHashtags !== '') {
                newTagsString = '[' + hashtags.filter((_, index) => !selectedItems.includes(index)).join(', ') + ', ' + newHashtags + ']';
            } else {
                newTagsString = '[' + hashtags.filter((_, index) => !selectedItems.includes(index)).join(', ') + ']';
            }
            console.log(newTagsString);
            setNewEmail(null);
            setNewPassword(null);
            setNewActor(null);
        } else if (type == 'actor') {
            setNewEmail(null);
            setNewPassword(null);
            setNewHashtags(null);
            setNewActor(selectedActor);
        }
        try {
            console.log(selectedActor);
            const response = await axios.post(`${rootURL}/confirm-changes`, {
                username,
                newEmail,
                newPassword,
                newTagsString,
                selectedActor
            });
            alert(response.data.message);
            setNewHashtags('');
            setNewActor('');
            setSelectedItems([]);
            setSelectedActor(newActor);
            navigate("/" + username + "/settings");
        } catch (error) {
          alert('Change failed.');
        }
    };

    const handleButton = (index) => {
        if (selectedItems.includes(index)) {
            setSelectedItems(selectedItems.filter((i) => i !== index));
        } else {
            setSelectedItems([...selectedItems, index]);
        }
    }

    const fetchActors = async (username) => {
        try {
          console.log(username);
          const response = await axios.get(`${rootURL}/${username}/actors`);
          console.log(response.status);
          if (response.status === 200) {
            setActors(response.data); // Assuming the response data is the list of actors
          } else {
            alert('Can not fetch actors');
          }
        } catch (error) {
          console.error('Error fetching actors:', error);
        }
      };

    return (
        <div className='w-screen h-screen flex items-center justify-center text-black min-w-[1000px]'>
            <SideNav username={username}></SideNav>
            <form>
                <div className='rounded-md bg-slate-50 p-6 space-y-2 w-full'>
                    <div className='font-bold flex w-full justify-center text-2xl mb-4 text-black'>
                        Settings
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="email" className='font-semibold'>Change Email</label>
                        <input
                            id="email"
                            type="text"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                        />
                        <button type="button" className='px-4 py-2 mx-2 mt-1 rounded-md bg-emerald-700 outline-none text-white'
                        onClick={() => confirmChanges('email')}>Confirm Email</button>
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="password" className='font-semibold'>Change Password</label>
                        <input
                            id="password"
                            type="password"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <label className='pl-36 py-2 ml-12 mx-2 mt-1 text-transparent'></label>
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="password" className='font-semibold'>Confirm New Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button type="button" className='px-4 py-2 mx-2 mt-1 rounded-md bg-emerald-700 outline-none text-white'
                        onClick={() => confirmChanges('password')}>Confirm Password</button>
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="hashtag" className='font-semibold'>Change Hashtags</label>
                        <div>
                            { hashtags.map((tag, index) => (
                                <button
                                type="button"
                                key={index}
                                className={`mx-2 p-2 rounded ${selectedItems.includes(index) ? "bg-red-500 text-white" : "bg-slate-500 text-white"}`}
                                onClick={() => handleButton(index)}> { tag } </button>
                            ))}
                        </div>
                        <input id="hashtag" type="text" className='outline-none bg-white rounded-md border border-slate-100 p-2'
                        value={newHashtags} onChange={(e) => setNewHashtags(e.target.value)} />
                        <button type="button" className='px-4 py-2 mx-2 mt-1 rounded-md bg-emerald-700 outline-none text-white'
                        onClick={() => confirmChanges('hashtags')}>Confirm Hashtags</button></div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="actor" className='font-semibold'>Change Associated Actor</label>
                        <div>
                            {actors.map(actor => (
                                <button 
                                    type="button" 
                                    key={actor.nconst} 
                                    className={`mx-2 p-2 rounded ${selectedActor == actor.nconst ? "bg-red-500 text-white" : "bg-slate-300 text-white"}`} 
                                    onClick={() => setSelectedActor(actor.nconst)}>
                                    {actor.primaryName}
                                </button>
                            ))}
                        </div>
                        {/* <input id="actor" type="text" className='outline-none bg-white rounded-md border border-slate-100 p-2'
                        value={newActor} onChange={(e) => setNewActor(e.target.value)} /> */}
                        <button type="button" className='px-4 py-2 mx-2 mt-1 rounded-md bg-emerald-700 outline-none text-white'
                        onClick={() => confirmChanges('actor')}>Confirm Actor</button>
                    </div>
                    {/* <div className='flex w-full justify-center text-l mb-4 text-black'>
                        <button type="button" className='px-4 py-2 mt-1 rounded-md bg-emerald-700 outline-none text-white'
                        onClick={confirmChange}>Confirm Change</button>
                    </div> */}
                </div>
            </form>
        </div>
    )
}