import React, { useEffect, useState } from 'react';

const getToken = () => {
  return localStorage.getItem('accessToken');
};

const ChannelList = ({ onSelect }) => {
  const [channels, setChannels] = useState([]); // State for storing channels
  const [loading, setLoading] = useState(true); // State for loading status

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const token = getToken();
        const response = await fetch('http://localhost:3001/user/channels', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch channels');
        }

        const data = await response.json();
        const channelsList = data.map(channel => ({
          id: channel.id,
          name: channel.name,
        }));
        setChannels(channelsList); // Update state with fetched channels
      } catch (error) {
        console.error('Error fetching channels:', error);
      } finally {
        setLoading(false); // Set loading to false
      }
    };

    fetchChannels(); // Call the function to fetch channels
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Show loading indicator
  }

  return (
    <div className="channel-list">
      {channels.map((channel) => (
        <div 
          key={channel.id} 
          className="channel-item"
          onClick={() => onSelect(channel)}>
          {channel.name}
        </div>
      ))}
    </div>
  );
};

export default ChannelList;