import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Проверка наличия токена в localStorage
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Если токен существует, получаем роль пользователя и навигируем
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'main-admin') {
        navigate('/main-admin');
      }
    }
  }, [navigate]);

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      localStorage.setItem('adminToken', data.token); // Сохраните токен в localStorage
      localStorage.setItem('userRole', data.user.role); // Сохраните роль пользователя в localStorage

      // Навигация в зависимости от роли пользователя
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'main-admin') {
        navigate('/main-admin');
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
        value={email}
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