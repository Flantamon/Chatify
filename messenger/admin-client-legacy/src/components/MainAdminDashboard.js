import React, { useEffect, useState } from 'react';

const MainAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Получение всех пользователей
        const usersResponse = await fetch('http://localhost:3001/main-admin/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
        });
        const usersData = await usersResponse.json();
        setUsers(usersData);

        // Получение активных пользователей
        const activeUsersResponse = await fetch('http://localhost:3001/main-admin/users/most-active', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
        });
        const activeUsersData = await activeUsersResponse.json();
        setActiveUsers(activeUsersData);

        // Получение общего количества пользователей
        const countResponse = await fetch('http://localhost:3001/main-admin/users/count', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
        });
        const countData = await countResponse.json();
        setTotalUsers(countData.count);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await fetch(`http://localhost:3001/main-admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });
      const response = await fetch('http://localhost:3001/main-admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error changing role:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`http://localhost:3001/main-admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
        });
  
        if (response.ok) {
          const response = await fetch('http://localhost:3001/main-admin/users', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            },
          });
          const data = await response.json();
          setUsers(data);
        } else {
          throw new Error('Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  return (
    <div className="main-admin-dashboard">
      <h2>Main Admin Dashboard</h2>
      
      <div className="total-users">
        <h3>Total Users: {totalUsers}</h3>
      </div>
  
      <div className="active-users-section">
        <h3>Most Active Users</h3>
        <table className="active-users-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Message Count</th>
            </tr>
          </thead>
          <tbody>
            {activeUsers.map(user => (
              // Используем user_id как ключ
              <tr key={user.user_id}>
                <td>{user.user_name}</td>
                <td>{user.message_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  
      <div className="all-users-section">
        <h3>All Users</h3>
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
                  <select
                    onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                    defaultValue={user.user_role}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button 
                    onClick={() => handleDeleteUser(user.user_id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MainAdminDashboard;