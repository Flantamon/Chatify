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

  const API_BASE = `${process.env.REACT_APP_API_PROTOCOL || 'https'}://${process.env.REACT_APP_API_BASE_URL}`;

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

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#121212',
      color: '#ffffff',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px',
      color: '#ffffff',
    },
    section: {
      backgroundColor: '#1e1e1e',
      borderRadius: '10px',
      padding: '20px',
      marginBottom: '30px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    },
    sectionTitle: {
      color: '#64b5f6',
      marginBottom: '20px',
      borderBottom: '2px solid #64b5f6',
      paddingBottom: '10px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: '#2a2a2a',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    },
    tableHeader: {
      backgroundColor: '#333333',
      color: '#ffffff',
      padding: '15px',
      textAlign: 'left',
      fontWeight: 'bold',
    },
    tableCell: {
      padding: '15px',
      borderBottom: '1px solid #444444',
      color: '#ffffff',
    },
    button: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      marginRight: '10px',
      transition: 'all 0.3s ease',
    },
    primaryButton: {
      backgroundColor: '#4caf50',
      color: '#ffffff',
    },
    primaryButtonHover: {
      backgroundColor: '#45a049',
    },
    dangerButton: {
      backgroundColor: '#f44336',
      color: '#ffffff',
    },
    dangerButtonHover: {
      backgroundColor: '#d32f2f',
    },
    warningButton: {
      backgroundColor: '#ff9800',
      color: '#ffffff',
    },
    warningButtonHover: {
      backgroundColor: '#f57c00',
    },
    input: {
      padding: '10px',
      border: '1px solid #555555',
      borderRadius: '5px',
      backgroundColor: '#2a2a2a',
      color: '#ffffff',
      fontSize: '14px',
      marginRight: '10px',
      width: '200px',
    },
    form: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '10px',
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: '20px',
      gap: '20px',
    },
    paginationButton: {
      padding: '10px 20px',
      backgroundColor: '#333333',
      color: '#ffffff',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
    },
    paginationButtonDisabled: {
      backgroundColor: '#555555',
      cursor: 'not-allowed',
    },
    paginationText: {
      color: '#cccccc',
      fontSize: '16px',
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Admin Dashboard</h2>

      {/* Users Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Users Management</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Name</th>
              <th style={styles.tableHeader}>Email</th>
              <th style={styles.tableHeader}>Status</th>
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={styles.tableCell}>{user.name}</td>
                <td style={styles.tableCell}>{user.email}</td>
                <td style={styles.tableCell}>{user.status}</td>
                <td style={styles.tableCell}>
                  {user.status === 'blocked' ? (
                    <button
                      style={{...styles.button, ...styles.primaryButton}}
                      onClick={() => handleUpdateUserStatus(user.id, 'active')}
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      style={{...styles.button, ...styles.dangerButton}}
                      onClick={() => handleUpdateUserStatus(user.id, 'blocked')}
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
      <div style={styles.pagination}>
        <button
          style={{
            ...styles.paginationButton,
            ...(currentPage === 1 ? styles.paginationButtonDisabled : {})
          }}
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span style={styles.paginationText}>Page {currentPage} of {totalPages}</span>
        <button
          style={{
            ...styles.paginationButton,
            ...(currentPage === totalPages ? styles.paginationButtonDisabled : {})
          }}
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {/* Channel Management Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Channel Management</h3>

        {/* Add Channel Form */}
        <div>
          <h4 style={{color: '#64b5f6', marginBottom: '15px'}}>Add New Channel</h4>
          <form style={styles.form} onSubmit={handleAddChannel}>
            <input
              style={styles.input}
              type="text"
              placeholder="Channel Name"
              value={newChannel.name}
              onChange={(e) =>
                setNewChannel({ ...newChannel, name: e.target.value })
              }
              required
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Channel Tag"
              value={newChannel.tag}
              onChange={(e) =>
                setNewChannel({ ...newChannel, tag: e.target.value })
              }
              required
            />
            <button style={{...styles.button, ...styles.primaryButton}} type="submit">Add Channel</button>
          </form>
        </div>

        {/* Channels Table */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>ID</th>
              <th style={styles.tableHeader}>Name</th>
              <th style={styles.tableHeader}>Tag</th>
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {channels.map(channel => (
              <tr key={channel.id}>
                <td style={styles.tableCell}>{channel.id}</td>
                <td style={styles.tableCell}>
                  {editingChannel?.id === channel.id ? (
                    <input
                      style={{...styles.input, width: '150px'}}
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
                <td style={styles.tableCell}>
                  {editingChannel?.id === channel.id ? (
                    <input
                      style={{...styles.input, width: '100px'}}
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
                <td style={styles.tableCell}>
                  {editingChannel?.id === channel.id ? (
                    <>
                      <button
                        style={{...styles.button, ...styles.primaryButton}}
                        onClick={() => handleEditChannel(channel.id)}
                      >
                        Save
                      </button>
                      <button
                        style={{...styles.button, backgroundColor: '#666', color: '#fff'}}
                        onClick={() => setEditingChannel(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        style={{...styles.button, ...styles.warningButton}}
                        onClick={() => setEditingChannel(channel)}
                      >
                        Edit
                      </button>
                      <button
                        style={{...styles.button, ...styles.dangerButton}}
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
      <div style={styles.pagination}>
        <button
          style={{
            ...styles.paginationButton,
            ...(channelCurrentPage === 1 ? styles.paginationButtonDisabled : {})
          }}
          onClick={handleChannelPreviousPage}
          disabled={channelCurrentPage === 1}
        >
          Previous
        </button>
        <span style={styles.paginationText}>Page {channelCurrentPage} of {channelTotalPages}</span>
        <button
          style={{
            ...styles.paginationButton,
            ...(channelCurrentPage === channelTotalPages ? styles.paginationButtonDisabled : {})
          }}
          onClick={handleChannelNextPage}
          disabled={channelCurrentPage === channelTotalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
