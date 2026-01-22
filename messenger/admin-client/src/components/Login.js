import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE = `https://${process.env.REACT_APP_API_BASE_URL}`;

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username, password }),
      });

      if (!response.ok) {
      if (response.status === 403) {
        setError('Unfortunately, you cannot log into the system. Your account has been blocked');
      } else {
        setError('Login failed. Please check your credentials.');
      }
        return;
      }

      const data = await response.json();

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userEmail', data.email);

      if (data.role === 'admin') {
        navigate('/admin');
      } else if (data.role === 'main_admin') {
        navigate('/main-admin');
      } else {
        setError('Access denied: insufficient privileges');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Admin Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={username}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Login'}
        </button>
        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  );
};

export default Login;
