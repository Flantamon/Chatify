import React, { useEffect, useState } from 'react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [newChannel, setNewChannel] = useState({ name: '', tag: '' });
  const [editingChannel, setEditingChannel] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchChannels();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchChannels = async () => {
    try {
      const response = await fetch('http://localhost:3001/admin/channels', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      const data = await response.json();
      setChannels(data);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3001/admin/users/${userId}/block`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3001/admin/users/${userId}/unblock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  const handleAddChannel = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/admin/channels', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newChannel),
      });
      if (response.ok) {
        setNewChannel({ name: '', tag: '' });
        window.location.reload();
      }
    } catch (error) {
      console.error('Error adding channel:', error);
    }
  };

  const handleEditChannel = async (channelId) => {
    try {
      const response = await fetch(`http://localhost:3001/admin/channels/${channelId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingChannel),
      });
      if (response.ok) {
        setEditingChannel(null);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error editing channel:', error);
    }
  };

  const handleDeleteChannel = async (channelId) => {
    if (window.confirm('Are you sure you want to delete this channel?')) {
      try {
        const response = await fetch(`http://localhost:3001/admin/channels/${channelId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
        });
        if (response.ok) {
          window.location.reload();
        }
      } catch (error) {
        console.error('Error deleting channel:', error);
      }
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>

      {/* Users Section */}
      <div className="users-section">
        <h3>Users Management</h3>
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.user_id}>
                <td>{user.user_name}</td>
                <td>{user.user_email}</td>
                <td>{user.user_status}</td>
                <td className="actions">
                  {user.user_status === 'blocked' ? (
                    <button 
                      onClick={() => handleUnblockUser(user.user_id)}
                      className="unblock-button"
                    >
                      Unblock
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleBlockUser(user.user_id)}
                      className="block-button"
                    >
                      Block
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Channel Management Section */}
      <div className="channels-section">
        <h3>Channel Management</h3>
        
        {/* Add Channel Form */}
        <div className="add-channel-form">
          <h4>Add New Channel</h4>
          <form onSubmit={handleAddChannel}>
            <input
              type="text"
              placeholder="Channel Name"
              value={newChannel.name}
              onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Channel Tag"
              value={newChannel.tag}
              onChange={(e) => setNewChannel({ ...newChannel, tag: e.target.value })}
              required
            />
            <button type="submit">Add Channel</button>
          </form>
        </div>

        {/* Channels Table */}
        <table className="channels-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Tag</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {channels.map(channel => (
              <tr key={channel.id}>
                <td>{channel.id}</td>
                <td>
                  {editingChannel?.id === channel.id ? (
                    <input
                      type="text"
                      value={editingChannel.name}
                      onChange={(e) => setEditingChannel({
                        ...editingChannel,
                        name: e.target.value
                      })}
                    />
                  ) : (
                    channel.name
                  )}
                </td>
                <td>
                  {editingChannel?.id === channel.id ? (
                    <input
                      type="text"
                      value={editingChannel.tag}
                      onChange={(e) => setEditingChannel({
                        ...editingChannel,
                        tag: e.target.value
                      })}
                    />
                  ) : (
                    channel.tag
                  )}
                </td>
                <td className="actions">
                  {editingChannel?.id === channel.id ? (
                    <>
                      <button 
                        className="save-button"
                        onClick={() => handleEditChannel(channel.id)}
                      >
                        Save
                      </button>
                      <button 
                        className="cancel-button"
                        onClick={() => setEditingChannel(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="edit-button"
                        onClick={() => setEditingChannel(channel)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteChannel(channel.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;