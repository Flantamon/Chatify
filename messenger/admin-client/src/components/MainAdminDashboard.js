import React, { useEffect, useState, useMemo, useCallback } from 'react';

const MainAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [exportedData, setExportedData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [mostActiveUsers, setMostActiveUsers] = useState([]);

  const API_BASE = `https://${process.env.REACT_APP_API_BASE_URL}/users`;
  
  const token = localStorage.getItem('adminToken');

  const headers = useMemo(() => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);

  const fetchAllUsers = useCallback(async () => {
    console.log('Fetching all users with headers:', headers);
    try {
      const response = await fetch(`${API_BASE}`, { headers });
      if (!response.ok) {
        throw new Error(`Ошибка при получении всех пользователей: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (data && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        console.error('Не удалось получить всех пользователей: данные некорректны или отсутствуют', data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Ошибка при получении всех пользователей:', error);
      setUsers([]);
    }
  }, [headers, API_BASE]);

  const fetchUserCount = useCallback(async () => {
    console.log('Fetching user count with headers:', headers);
    try {
      const response = await fetch(`${API_BASE}/count`, { headers });
      if (!response.ok) {
        throw new Error(`Ошибка при получении количества пользователей: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setTotalUsers(data.count);
    } catch (error) {
      console.error('Ошибка при получении количества пользователей:', error);
      setTotalUsers(0);
    }
  }, [headers, API_BASE]);

  const fetchMostActiveUsers = useCallback(async () => {
    console.log('Fetching most active users with headers:', headers);
    try {
      const response = await fetch(`${API_BASE}/most-active?page=${currentPage}&limit=${limit}`, { headers });
      if (!response.ok) {
        throw new Error(`Ошибка при получении наиболее активных пользователей: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (data && Array.isArray(data.users)) {
        setMostActiveUsers(data.users);
      } else {
        console.error('Не удалось получить наиболее активных пользователей: данные некорректны', data);
        setMostActiveUsers([]);
      }
    } catch (error) {
      console.error('Ошибка при получении наиболее активных пользователей:', error);
      setMostActiveUsers([]);
    }
  }, [currentPage, limit, headers, API_BASE]);

  useEffect(() => {
    fetchAllUsers();
    fetchUserCount();
    fetchMostActiveUsers();
  }, [currentPage, limit, fetchAllUsers, fetchUserCount, fetchMostActiveUsers]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await fetch(`${API_BASE}/${userId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ role: newRole }),
      });
      fetchAllUsers();
    } catch (error) {
      console.error('Ошибка при смене роли:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Удалить пользователя?')) return;

    try {
      await fetch(`${API_BASE}/${userId}`, {
        method: 'DELETE',
        headers,
      });
      fetchAllUsers();
    } catch (error) {
      console.error('Ошибка при удалении:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`${API_BASE}/export`, { headers });
      const data = await response.json();
      setExportedData(data.exported);
      alert('Данные экспортированы в консоль');
      console.log('Exported users:', data.exported);
    } catch (error) {
      console.error('Ошибка при экспорте:', error);
    }
  };

  const handleImport = async () => {
    if (!exportedData) return alert('Нет данных для импорта');

    try {
      await fetch(`${API_BASE}/import`, {
        method: 'POST',
        headers,
        body: JSON.stringify(exportedData),
      });
      fetchAllUsers();
      alert('Данные успешно импортированы');
    } catch (error) {
      console.error('Ошибка при импорте:', error);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="main-admin-dashboard">
      <h2>Main Admin Dashboard</h2>

      <div className="total-users">
        <h3>Total Users: {totalUsers}</h3>
        <button onClick={handleExport}>Export Users</button>
        <button onClick={handleImport}>Import Users</button>
      </div>

      <div className="most-active-users-section">
        <h3>Most Active Users</h3>
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Role</th>
              <th>Message Count</th>
            </tr>
          </thead>
          <tbody>
            {mostActiveUsers.length > 0 ? (
              mostActiveUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.status}</td>
                  <td>{user.role}</td>
                  <td>{user.messageCount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">Нет активных пользователей</td>
              </tr>
            )}
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
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.status}</td>
                  <td>
                    <select
                      defaultValue={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="main_admin">Main Admin</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">Нет пользователей</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          Previous
        </button>
        <span>Page {currentPage}</span>
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={users.length < limit}>
          Next
        </button>
      </div>
    </div>
  );
};

export default MainAdminDashboard;
