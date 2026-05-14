import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import ObservationForm from './components/ObservationForm';
import AdminDashboard from './components/AdminDashboard';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        } else {
          setRole('observer');
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) return null;

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-background-tertiary)' }}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <ObservationForm />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>

        {user && (
          <nav style={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            background: '#fff', 
            borderTop: '0.5px solid var(--color-border-primary)', 
            display: 'flex', 
            justifyContent: 'space-around', 
            padding: '12px',
            zIndex: 1000,
            boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
          }}>
            <Link to="/" style={{ 
              textDecoration: 'none', 
              color: 'var(--color-text-secondary)', 
              fontSize: '11px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500
            }}>
              <i className="ti ti-clipboard-list" style={{ fontSize: '20px' }}></i>
              <span>Form</span>
            </Link>
            
            {role === 'admin' && (
              <Link to="/admin" style={{ 
                textDecoration: 'none', 
                color: 'var(--color-text-secondary)', 
                fontSize: '11px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: '4px',
                fontWeight: 500
              }}>
                <i className="ti ti-chart-bar" style={{ fontSize: '20px' }}></i>
                <span>Dashboard</span>
              </Link>
            )}

            <div onClick={handleLogout} style={{ 
              textDecoration: 'none', 
              color: '#A32D2D', 
              fontSize: '11px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              fontWeight: 500
            }}>
              <i className="ti ti-logout" style={{ fontSize: '20px' }}></i>
              <span>Logout</span>
            </div>
          </nav>
        )}
        
        {/* Spacer for fixed nav */}
        {user && <div style={{ height: '70px' }}></div>}
      </div>
    </Router>
  );
}

export default App;
