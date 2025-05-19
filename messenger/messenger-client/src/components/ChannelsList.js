import React, { useEffect, useState } from 'react';

const getToken = () => localStorage.getItem('accessToken');

const ChannelList = ({ onSelect }) => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelTag, setNewChannelTag] = useState('');
  const [searchTag, setSearchTag] = useState('');
  const [filteredChannels, setFilteredChannels] = useState([]);

  const fetchChannels = async () => {
    try {
      const token = getToken();
      const response = await fetch(`https://${process.env.REACT_APP_USER_CLIENT_HOST}/channels`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch channels');
      const data = await response.json();
      const channelsList = data.channels.map(channel => ({
        id: channel.id,
        name: channel.name,
      }));
      setChannels(channelsList);
      setFilteredChannels(channelsList);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    try {
      const token = getToken();
      const response = await fetch(`https://${process.env.REACT_APP_USER_CLIENT_HOST}/channels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newChannelName,
          tag: newChannelTag,
        }),
      });

      if (!response.ok) throw new Error('Failed to create channel');

      setNewChannelName('');
      setNewChannelTag('');
      fetchChannels();
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  };

  const handleDeleteChannel = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this channel?');
    if (!confirmDelete) return;

    try {
      const token = getToken();
      const response = await fetch(`https://${process.env.REACT_APP_USER_CLIENT_HOST}/channels/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete channel');

      fetchChannels();
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  };

  // const handleSearchByTag = async () => {
  //   if (!searchTag) return;

  //   try {
  //     const token = getToken();
  //     const response = await fetch(`https://${process.env.REACT_APP_USER_CLIENT_HOST}/channels/tag/${searchTag}`, {
  //       method: 'GET',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //       },
  //     });

  //     if (!response.ok) throw new Error('Channel not found');

  //     const data = await response.json();
  //     setChannels([{ id: data.id, name: data.name }]);
  //   } catch (error) {
  //     console.error('Error searching by tag:', error);
  //   }
  // };

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    const filtered = channels.filter(channel =>
      channel.name.toLowerCase().includes(searchTag.toLowerCase())
    );
    setFilteredChannels(filtered);
  }, [searchTag, channels]);

  if (loading) return <div>Loading channels...</div>;

  return (
    <div className="channel-list">

      {/* Channels display */}
      {filteredChannels.map((channel) => (
        <div
          key={channel.id}
          className="channel-item"
          onClick={() => onSelect(channel)}
          onContextMenu={(e) => {
            e.preventDefault();
            handleDeleteChannel(channel.id);
          }}
        >
          {channel.name}
        </div>
      ))}
    </div>
  );
};

export default ChannelList;
