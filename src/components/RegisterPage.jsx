import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    
    setLoading(true);
    setError(null);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 2. Create user profile in Firestore with 'observer' role
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        role: 'observer',
        created_at: new Date().toISOString()
      });
      
      // 3. Redirect to home (Form)
      navigate('/');
    } catch (err) {
      console.error("Registration error details:", err);
      
      // Specific error mapping for better user feedback
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please sign in instead.");
      } else if (err.code === 'auth/invalid-api-key' || err.code === 'auth/network-request-failed') {
        setError("Database connection error. Please check your Firebase API keys in src/lib/firebase.js.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password provider is not enabled in your Firebase Console.");
      } else if (err.code === 'permission-denied') {
        setError("Firestore permission denied. Please check your database rules.");
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
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
        <h2>Create Account</h2>
        <p>Join the monitoring platform</p>
        
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input 
              type="text" 
              className="login-input" 
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
              placeholder="min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <input 
              type="password" 
              className="login-input" 
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Register Now"}
          </button>
        </form>
        
        <div className="footer-text">
          Already have an account? <Link to="/login" className="link-text">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
