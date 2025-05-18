import React, { useState } from 'react';
// import ReCAPTCHA from 'react-google-recaptcha';

const Register = ({ onRegisterSuccess, switchToLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // const [captchaValue, setCaptchaValue] = useState(null);

  // useEffect(() => {
  //   const script = document.createElement('script');
  //   script.src = `https://www.google.com/recaptcha/enterprise.js?render=${process.env.REACT_APP_RECAPTCHA_SITE_KEY}`;
  //   script.async = true;
  //   document.body.appendChild(script);
  // }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setUsernameError('');
    setEmailError('');
    setPasswordError('');
    setIsLoading(true);

    console.log('Registration attempt:', { username, email, password });

    // Commenting out CAPTCHA check
    // if (!captchaValue) {
    //   setError('Please complete the CAPTCHA.');
    //   setIsLoading(false);
    //   return;
    // }

    try {
      // Commenting out token generation
      // const token = await window.grecaptcha.enterprise.execute(process.env.REACT_APP_RECAPTCHA_SITE_KEY, { action: 'submit' });
      // console.log('reCAPTCHA Token:', token);

      // console.log('Sending registration request with token:', token);

      const response = await fetch(`https://${process.env.REACT_APP_USER_CLIENT_HOST}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: username,
          email,
          password,
          // role: 'user',
          // captcha: token
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Registration failed:', errorData);

        if (errorData.message) {
          errorData.message.forEach((msg) => {
            if (msg.includes('property role should not exist')) {
              setPasswordError('Role should not be included in the request.');
            } else if (msg.includes('Password must contain at least')) {
              setPasswordError('Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number.');
            } else if (msg.includes('password must be longer than or equal to 8 characters')) {
              setPasswordError('Password must be at least 8 characters long.');
            } else if (msg.includes('This email already exists')) {
              setEmailError('This email is already registered.');
            }
          });
        } else {
          setError('Registration failed. Please try again.');
        }
        throw new Error('Registration failed');
      } else {
        const data = await response.json();
        console.log('Registration successful:', data);

        const responseLogin = await fetch(`https://${process.env.REACT_APP_USER_CLIENT_HOST}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const loginData = await responseLogin.json();
        console.log('Login response:', loginData);

        localStorage.setItem('accessToken', loginData.token);
        onRegisterSuccess();

        console.log('Response status:', response.status);
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join us today!</p>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            {usernameError && <div className="error-message">{usernameError}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {emailError && <div className="error-message">{emailError}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {passwordError && <div className="error-message">{passwordError}</div>}
          </div>

          {/* Commenting out ReCAPTCHA component
          <ReCAPTCHA
            sitekey="6Lfe5i8rAAAAAOUMNzrcUaJf_OsYO5JCi53eojnn"
            onChange={(value) => setCaptchaValue(value)}
          /> */}
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Register'}
          </button>
        </form>
        
        <div className="auth-footer">
          Already have an account?{' '}
          <span className="auth-link" onClick={switchToLogin}>
            Sign in
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;