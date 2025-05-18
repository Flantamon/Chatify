import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const API_BASE = `https://${process.env.REACT_APP_API_BASE_URL}`

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'main_admin') {
        navigate('/main-admin');
      }
    }
  }, [navigate]);

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userEmail', data.email);

      console.log(localStorage.getItem(data.role));

      if (data.role === 'admin') {
        navigate('/admin');
      } else if (data.role === 'main_admin') {
        navigate('/main-admin');
      } else {
        alert('Access denied: insufficient privileges');
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-container">
      <h2>Admin Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={username}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
