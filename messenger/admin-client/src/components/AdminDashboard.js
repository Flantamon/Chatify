import React, { useEffect, useState, useCallback } from 'react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [newChannel, setNewChannel] = useState({ name: '', tag: '' });
  const [editingChannel, setEditingChannel] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [channelCurrentPage, setChannelCurrentPage] = useState(1);
  const [channelTotalPages, setChannelTotalPages] = useState(1);
  const usersPerPage = 5;
  const channelsPerPage = 5;

  const API_BASE = `https://${process.env.REACT_APP_API_BASE_URL}`;

  const token = localStorage.getItem('adminToken');

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/users?page=${currentPage}&limit=${usersPerPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
        setTotalPages(Math.ceil(data.totalCount / usersPerPage));
      } else {
        console.error('Users data is undefined or empty:', data);
        setUsers([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [API_BASE, token, currentPage]);

  const fetchChannels = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/channels?page=${channelCurrentPage}&limit=${channelsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.channels && Array.isArray(data.channels)) {
        setChannels(data.channels);
        setChannelTotalPages(Math.ceil(data.totalCount / channelsPerPage));
      } else {
        console.error('Channels data is undefined or empty:', data);
        setChannels([]);
        setChannelTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  }, [API_BASE, token, channelCurrentPage]);

  useEffect(() => {
    fetchUsers();
    fetchChannels();
  }, [fetchUsers, fetchChannels, currentPage, channelCurrentPage]);

  const handleUpdateUserStatus = async (userId, status) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleAddChannel = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/channels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newChannel),
      });
      if (response.ok) {
        setNewChannel({ name: '', tag: '' });
        fetchChannels();
      }
    } catch (error) {
      console.error('Error adding channel:', error);
    }
  };

  const handleEditChannel = async (channelId) => {
    try {
      const response = await fetch(`${API_BASE}/channels/${channelId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingChannel),
      });
      if (response.ok) {
        setEditingChannel(null);
        fetchChannels();
      }
    } catch (error) {
      console.error('Error editing channel:', error);
    }
  };

  const handleDeleteChannel = async (channelId) => {
    if (window.confirm('Are you sure you want to delete this channel?')) {
      try {
        const response = await fetch(`${API_BASE}/channels/${channelId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          fetchChannels();
        }
      } catch (error) {
        console.error('Error deleting channel:', error);
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };

  const handleChannelNextPage = () => {
    if (channelCurrentPage < channelTotalPages) {
      setChannelCurrentPage(prevPage => prevPage + 1);
    }
  };

  const handleChannelPreviousPage = () => {
    if (channelCurrentPage > 1) {
      setChannelCurrentPage(prevPage => prevPage - 1);
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
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.status}</td>
                <td className="actions">
                  {user.status === 'blocked' ? (
                    <button
                      onClick={() => handleUpdateUserStatus(user.id, 'active')}
                      className="unblock-button"
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateUserStatus(user.id, 'blocked')}
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

      {/* Pagination Controls */}
      <div className="pagination-controls">
        <button onClick={handlePreviousPage} disabled={currentPage === 1}>
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={currentPage === totalPages}>
          Next
        </button>
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
              onChange={(e) =>
                setNewChannel({ ...newChannel, name: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Channel Tag"
              value={newChannel.tag}
              onChange={(e) =>
                setNewChannel({ ...newChannel, tag: e.target.value })
              }
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
                      onChange={(e) =>
                        setEditingChannel({
                          ...editingChannel,
                          name: e.target.value,
                        })
                      }
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
                      onChange={(e) =>
                        setEditingChannel({
                          ...editingChannel,
                          tag: e.target.value,
                        })
                      }
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

      {/* Channel Pagination Controls */}
      <div className="pagination-controls">
        <button onClick={handleChannelPreviousPage} disabled={channelCurrentPage === 1}>
          Previous
        </button>
        <span>Page {channelCurrentPage} of {channelTotalPages}</span>
        <button onClick={handleChannelNextPage} disabled={channelCurrentPage === channelTotalPages}>
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
