import React, { useEffect, useState, useMemo, useCallback } from 'react';

const MainAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [mostActiveUsers, setMostActiveUsers] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('ASC');

  const API_BASE = `${process.env.REACT_APP_API_PROTOCOL || 'https'}://${process.env.REACT_APP_API_BASE_URL}`;
  
  const token = localStorage.getItem('adminToken');

  const headers = useMemo(() => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);

  const fetchAllUsers = useCallback(async (customSortBy, customSortDirection) => {
    try {
      const sortParams = customSortBy ? `&sortBy=${customSortBy}&sortDirection=${customSortDirection}` : '';
      const response = await fetch(`${API_BASE}/users?page=${currentPage}&limit=${limit}${sortParams}`, { headers });
      if (!response.ok) {
        throw new Error(`Ошибка при получении всех пользователей: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (data && Array.isArray(data.users)) {
        setUsers(data.users);
        setTotalUsers(data.totalCount || data.users.length);
      } else {
        setUsers([]);
      }
    } catch (error) {
      setUsers([]);
    }
  }, [currentPage, limit, headers, API_BASE]);

  const fetchUserCount = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/users/count`, { headers });
      if (!response.ok) {
        throw new Error(`Ошибка при получении количества пользователей: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setTotalUsers(data.count);
    } catch (error) {
      setTotalUsers(0);
    }
  }, [headers, API_BASE]);

  const fetchMostActiveUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/users/most-active?limit=10`, { headers });
      if (!response.ok) {
        throw new Error(`Ошибка при получении наиболее активных пользователей: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (data) {
        setMostActiveUsers(data);
      } else {
        setMostActiveUsers([]);
      }
    } catch (error) {
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
      await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ role: newRole }),
      });
      fetchAllUsers(sortBy, sortDirection);
    } catch (error) {
      console.error('Ошибка при смене роли:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Удалить пользователя?')) return;

    try {
      await fetch(`${API_BASE}/users/${userId}`, {
        method: 'DELETE',
        headers,
      });
      fetchAllUsers(sortBy, sortDirection);
    } catch (error) {
      console.error('Ошибка при удалении:', error);
    }
  };



  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
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
    totalUsers: {
      backgroundColor: '#2a2a2a',
      borderRadius: '8px',
      padding: '15px',
      textAlign: 'center',
      marginBottom: '30px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    },
    totalUsersText: {
      color: '#4caf50',
      fontSize: '24px',
      fontWeight: 'bold',
      margin: 0,
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
    select: {
      padding: '8px',
      backgroundColor: '#444444',
      color: '#ffffff',
      border: '1px solid #555555',
      borderRadius: '4px',
      fontSize: '14px',
    },
    button: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      backgroundColor: '#f44336',
      color: '#ffffff',
      transition: 'background-color 0.3s ease',
    },
    buttonHover: {
      backgroundColor: '#d32f2f',
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
    emptyRow: {
      textAlign: 'center',
      color: '#cccccc',
      fontStyle: 'italic',
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Main Admin Dashboard</h2>

      <div style={styles.totalUsers}>
        <h3 style={styles.totalUsersText}>Total Users: {totalUsers}</h3>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Most Active Users</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Name</th>
              <th style={styles.tableHeader}>Email</th>
              <th style={styles.tableHeader}>Status</th>
              <th style={styles.tableHeader}>Role</th>
              <th style={styles.tableHeader}>Message Count</th>
            </tr>
          </thead>
          <tbody>
            {mostActiveUsers.length > 0 ? (
              mostActiveUsers.map(user => (
                <tr key={user.id}>
                  <td style={styles.tableCell}>{user.name}</td>
                  <td style={styles.tableCell}>{user.email}</td>
                  <td style={styles.tableCell}>{user.status}</td>
                  <td style={styles.tableCell}>{user.role}</td>
                  <td style={styles.tableCell}>{user.max_messages}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={styles.emptyRow}>Нет активных пользователей</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>All Users</h3>
        <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <label style={{ color: '#ffffff', fontWeight: 'bold' }}>
            Сортировать по:
            <select
              style={{ ...styles.select, marginLeft: '10px' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Имени</option>
              <option value="role">Роли</option>
              <option value="status">Статусу</option>
              <option value="email">Email</option>
            </select>
          </label>
          <label style={{ color: '#ffffff', fontWeight: 'bold' }}>
            Направление:
            <select
              style={{ ...styles.select, marginLeft: '10px' }}
              value={sortDirection}
              onChange={(e) => setSortDirection(e.target.value)}
            >
              <option value="ASC">По возрастанию</option>
              <option value="DESC">По убыванию</option>
            </select>
          </label>
          <button
            style={{ ...styles.button, backgroundColor: '#4caf50' }}
            onClick={() => {
              setCurrentPage(1);
              fetchAllUsers(sortBy, sortDirection);
            }}
          >
            Применить
          </button>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Name</th>
              <th style={styles.tableHeader}>Email</th>
              <th style={styles.tableHeader}>Status</th>
              <th style={styles.tableHeader}>Role</th>
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map(user => (
                <tr key={user.id}>
                  <td style={styles.tableCell}>{user.name}</td>
                  <td style={styles.tableCell}>{user.email}</td>
                  <td style={styles.tableCell}>{user.status}</td>
                  <td style={styles.tableCell}>
                    <select
                      style={styles.select}
                      defaultValue={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="main_admin">Main Admin</option>
                    </select>
                  </td>
                  <td style={styles.tableCell}>
                    <button
                      style={styles.button}
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={styles.emptyRow}>Нет пользователей</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.pagination}>
        <button
          style={{
            ...styles.paginationButton,
            ...(currentPage === 1 ? styles.paginationButtonDisabled : {})
          }}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span style={styles.paginationText}>Page {currentPage}</span>
        <button
          style={{
            ...styles.paginationButton,
            ...(users.length < limit ? styles.paginationButtonDisabled : {})
          }}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={users.length < limit}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default MainAdminDashboard;
