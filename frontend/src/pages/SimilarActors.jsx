import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import config from '../../config.json';


export default function SimilarActors() {
  const navigate = useNavigate(); 
  const { username } = useParams();
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const rootURL = config.serverRootURL;

  useEffect(() => {

    console.log(username);
    if (username) {
      fetchActors(username);
    } else {
      setError('Username or URL is not available in cookies.');
    }
  }, []);

  const fetchActors = async (username) => {
    try {
      setLoading(true);
      console.log(username);
      const response = await axios.get(`${rootURL}/${username}/actors`);
      console.log(response.status);
      if (response.status === 200) {
        setActors(response.data); // Assuming the response data is the list of actors
        setLoading(false);
      } else {
        alert('Can not fetch actors');
      }
    } catch (error) {
      console.error('Error fetching actors:', error);
      setError(error.response ? error.response.data.error : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleActorClick = async (actor) => {
    const nconst = actor.nconst;
    console.log(nconst);
    console.log(username);
    try {
      const response = await axios.post(`${rootURL}/userActorPreference/${username}/${nconst}`);

      if (response.status === 200) {
        navigate('/login');
      } else {
        alert('Error setting up linked actor');
      }
      
      console.log('Response:', response.data);
      // Handle further actions based on response if needed
    } catch (error) {
      console.error('Error sending actor data:', error);
      alert('Failed to send actor data: ' + (error.response ? error.response.data.error : 'An unexpected error occurred'));
    }
  };

  return (
    <div>
      <h1>Actors</h1>
      {loading ? <p>Loading actors...</p> : null}
      {error ? <p>Error: {error}</p> : null}
      {actors.map(actor => (
        <button key={actor.nconst} onClick={() => handleActorClick(actor)}>
          {actor.primaryName}
        </button>
      ))}
    </div>
  );
}


