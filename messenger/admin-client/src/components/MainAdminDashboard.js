import React, { useEffect, useState, useMemo, useCallback } from 'react';

const MainAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
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
      const response = await fetch(`${API_BASE}?page=${currentPage}&limit=${limit}`, { headers });
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
  }, [currentPage, limit, headers, API_BASE]);

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
      const response = await fetch(`${API_BASE}/most-active?limit=10`, { headers });
      if (!response.ok) {
        throw new Error(`Ошибка при получении наиболее активных пользователей: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (data) {
        setMostActiveUsers(data);
      } else {
        console.error('Не удалось получить наиболее активных пользователей: данные некорректны', data);
        setMostActiveUsers([]);
      }
    } catch (error) {
      console.error('Ошибка при получении наиболее активных пользователей:', error);
      setMostActiveUsers([]);
    }
  }, [headers, API_BASE]);

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
      console.log('Exported users:', data.exported);

      // Create a Blob from the JSON data
      const jsonBlob = new Blob([JSON.stringify(data.exported, null, 2)], { type: 'application/json' });

      // Create a link element
      const url = URL.createObjectURL(jsonBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'users_export.json'; // Specify the filename

      // Append the link to the body and click it to trigger the download
      document.body.appendChild(link);
      link.click();

      // Clean up by revoking the object URL
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Данные экспортированы в файл users_export.json');

    } catch (error) {
      console.error('Ошибка при экспорте:', error);
      alert('Ошибка при экспорте данных');
    }
  };

  const handleImport = async () => {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json'; // Accept only JSON files

    // Trigger the file selection dialog
    fileInput.click();

    // Listen for file selection
    fileInput.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) {
        alert('Файл не выбран');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          if (!Array.isArray(importedData)) {
            throw new Error('Некорректный формат файла: ожидается массив пользователей.');
          }

          await fetch(`${API_BASE}/import`, {
            method: 'POST',
            headers,
            body: JSON.stringify(importedData),
          });
          fetchAllUsers();
          alert('Данные успешно импортированы');
        } catch (error) {
          console.error('Ошибка при импорте:', error);
          alert(`Ошибка при импорте данных: ${error.message}`);
        }
      };
      reader.readAsText(file);
    };
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="main-admin-dashboard">
      <h2>Main Admin Dashboard</h2>

      <div className="total-users">
        <h3>Total Users: {totalUsers}</h3>
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
                  <td>{user.max_messages}</td>
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

      <div className="export-import-buttons" style={{ marginTop: '20px' }}>
        <button onClick={handleExport} style={{ marginRight: '10px' }}>
          Export Users
        </button>
        <button onClick={handleImport}>
          Import Users
        </button>
      </div>
    </div>
  );
};

export default MainAdminDashboard;
