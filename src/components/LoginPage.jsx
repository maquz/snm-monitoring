import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Fetch user role from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        // Default to observer if no role found
        navigate('/');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #085041 0%, #0F6E56 100%);
          padding: 20px;
          font-family: 'Inter', sans-serif;
        }
        .login-card {
          background: #fff;
          width: 100%;
          max-width: 380px;
          padding: 40px 30px;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          text-align: center;
        }
        .logo-wrap {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .login-card h2 {
          font-family: 'Outfit', sans-serif;
          color: #1a1a1a;
          margin-bottom: 8px;
          font-size: 24px;
        }
        .login-card p {
          color: #666;
          font-size: 14px;
          margin-bottom: 32px;
        }
        .input-group {
          margin-bottom: 18px;
          text-align: left;
        }
        .input-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #444;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .login-input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #eee;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.3s;
          outline: none;
        }
        .login-input:focus {
          border-color: #0F6E56;
          background: #f9fdfc;
        }
        .login-btn {
          width: 100%;
          padding: 14px;
          background: #0F6E56;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 10px;
        }
        .login-btn:hover {
          background: #085041;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(15, 110, 86, 0.2);
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .error-msg {
          background: #FCEBEB;
          color: #A32D2D;
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 20px;
          border: 0.5px solid rgba(163, 45, 45, 0.2);
        }
        .footer-text {
          margin-top: 24px;
          font-size: 13px;
          color: #888;
        }
        .link-text {
          color: #0F6E56;
          text-decoration: none;
          font-weight: 600;
        }
        .link-text:hover {
          text-decoration: underline;
        }
      `}</style>
      <div className="login-card">
        <div className="logo-wrap">
          <img src={logo} alt="GES Logo" className="logo-img" />
        </div>
        <h2>GES Monitoring</h2>
        <p>Sign in to access the monitoring portal</p>
        
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input 
              type="email" 
              className="login-input" 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="login-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
        
        <div className="footer-text">
          Don't have an account? <Link to="/register" className="link-text">Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
