import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import logo from '../assets/logo.png';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  
  // Users State
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Schools State
  const [schools, setSchools] = useState([]);
  const [newSchool, setNewSchool] = useState('');
  const [newCircuit, setNewCircuit] = useState('');
  const [loadingSchools, setLoadingSchools] = useState(true);

  // Observations State (for Export & Maintenance)
  const [obsCount, setObsCount] = useState(0);

  // Edit Modals State
  const [editUser, setEditUser] = useState(null);
  const [editSchool, setEditSchool] = useState(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingUsers(false);
    });
    const unsubSchools = onSnapshot(collection(db, "schools"), (snapshot) => {
      setSchools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingSchools(false);
    });
    const unsubObs = onSnapshot(collection(db, "observations"), (snapshot) => {
      setObsCount(snapshot.docs.length);
    });
    return () => { unsubUsers(); unsubSchools(); unsubObs(); };
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
    } catch (err) {
      console.error("Error updating role:", err);
      alert("Failed to update role. Ensure you have the necessary permissions.");
    }
  };

  const handlePasswordReset = async (email) => {
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Password reset email sent to ${email}`);
    } catch (err) {
      console.error("Error sending reset email:", err);
      alert("Failed to send reset email.");
    }
  };

  const handleAddSchool = async (e) => {
    e.preventDefault();
    if (!newSchool.trim() || !newCircuit.trim()) return alert("Both Circuit and School names are required.");
    try {
      await addDoc(collection(db, "schools"), { name: newSchool.trim(), circuit: newCircuit.trim() });
      setNewSchool('');
    } catch (err) {
      console.error("Error adding school:", err);
      alert("Failed to add school.");
    }
  };

  const handleDeleteSchool = async (schoolId) => {
    if (!window.confirm("Are you sure you want to delete this school?")) return;
    try {
      await deleteDoc(doc(db, "schools", schoolId));
    } catch (err) {
      console.error("Error deleting school:", err);
      alert("Failed to delete school.");
    }
  };

  const handleUpdateSchool = async (e) => {
    e.preventDefault();
    if (!editSchool) return;
    try {
      await updateDoc(doc(db, "schools", editSchool.id), {
        name: editSchool.name,
        circuit: editSchool.circuit
      });
      setEditSchool(null);
    } catch (err) {
      console.error("Error updating school:", err);
      alert("Failed to update school.");
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      await updateDoc(doc(db, "users", editUser.id), {
        name: editUser.name,
        role: editUser.role
      });
      setEditUser(null);
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Failed to update user.");
    }
  };

  const exportUsersCSV = () => {
    const header = "ID,Name,Email,Role\n";
    const csv = users.map(u => `"${u.id}","${u.name || ''}","${u.email}","${u.role || 'observer'}"`).join('\n');
    downloadCSV(header + csv, 'users_export.csv');
  };

  const exportObsCSV = async () => {
    const snapshot = await getDocs(collection(db, "observations"));
    const obs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    if (obs.length === 0) return alert("No observations to export.");
    
    // Grab keys from the first observation (excluding objects like A, B, C, D)
    const keys = ["id", "teacher", "school", "date", "subject", "total_score", "grade", "monitorName"];
    const header = keys.join(",") + "\n";
    const csv = obs.map(o => keys.map(k => `"${o[k] || ''}"`).join(",")).join("\n");
    downloadCSV(header + csv, 'observations_export.csv');
  };

  const downloadCSV = (csvContent, fileName) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="dash">
      <style>{`
        .dash { background: var(--color-background-tertiary); min-height: 100vh; padding-bottom: 80px; }
        .topbar { background: #085041; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
        .topbar-l { color: #9FE1CB; font-size: 13px; font-weight: 500; }
        .nav-tabs { display: flex; gap: 2px; background: #0F6E56; padding: 0 12px; }
        .tab { padding: 10px 14px; font-size: 12px; color: #9FE1CB; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 500; letter-spacing: 0.03em; text-transform: uppercase; }
        .tab.active { color: #E1F5EE; border-bottom-color: #5DCAA5; }
        .body { padding: 16px; }
        .card { background: var(--color-background-primary); border-radius: var(--border-radius-lg); border: 0.5px solid var(--color-border-tertiary); margin-bottom: 16px; overflow: hidden; }
        .card-head { padding: 14px 16px; border-bottom: 0.5px solid var(--color-border-tertiary); font-size: 14px; font-weight: 600; color: #0F6E56; display: flex; justify-content: space-between; align-items: center; }
        .card-body { padding: 0; }
        .search-bar { width: 100%; padding: 10px 16px; border: none; border-bottom: 0.5px solid var(--color-border-tertiary); font-size: 13px; outline: none; background: var(--color-background-secondary); }
        .user-row, .school-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 0.5px solid var(--color-border-tertiary); }
        .user-row:last-child, .school-row:last-child { border-bottom: none; }
        .user-info { display: flex; align-items: center; gap: 12px; }
        .avatar { width: 36px; height: 36px; border-radius: 50%; background: #E1F5EE; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: #085041; flex-shrink: 0; }
        .user-name, .school-name { font-size: 14px; font-weight: 500; color: var(--color-text-primary); }
        .user-email { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }
        .actions { display: flex; align-items: center; gap: 8px; }
        .role-select { padding: 6px 10px; border-radius: 8px; border: 1px solid var(--color-border-secondary); font-size: 12px; background: var(--color-background-secondary); color: var(--color-text-primary); cursor: pointer; outline: none; }
        .btn-small { padding: 6px 10px; border-radius: 8px; border: 1px solid var(--color-border-secondary); font-size: 12px; background: var(--color-background-primary); color: var(--color-text-secondary); cursor: pointer; }
        .btn-small:hover { background: var(--color-background-secondary); }
        .btn-primary { padding: 10px 16px; background: #0F6E56; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .add-school-form { padding: 16px; display: flex; gap: 8px; background: var(--color-background-secondary); border-bottom: 0.5px solid var(--color-border-tertiary); }
        .school-input { flex: 1; padding: 10px 12px; border: 1px solid var(--color-border-secondary); border-radius: 8px; font-size: 13px; outline: none; }
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px; }
        .stat-box { background: var(--color-background-secondary); padding: 16px; border-radius: 8px; border: 0.5px solid var(--color-border-tertiary); text-align: center; }
        .stat-val { font-size: 24px; font-weight: 700; color: #0F6E56; }
        .stat-lbl { font-size: 11px; color: var(--color-text-secondary); text-transform: uppercase; margin-top: 4px; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-content { background: var(--color-background-primary); width: 100%; max-width: 500px; border-radius: var(--border-radius-lg); padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid var(--color-border-secondary); padding-bottom: 16px; }
        .modal-title { font-size: 18px; font-weight: 600; color: #0F6E56; margin-bottom: 4px; }
        .modal-subtitle { font-size: 13px; color: var(--color-text-secondary); }
        .modal-close { background: none; border: none; font-size: 24px; color: var(--color-text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; transition: background 0.2s; }
        .modal-close:hover { background: var(--color-background-secondary); color: var(--color-text-primary); }
        .field-group { margin-bottom: 16px; }
        .field-label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500; color: var(--color-text-secondary); }
        .field-input { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--color-border-tertiary); font-size: 14px; outline: none; background: var(--color-background-primary); color: var(--color-text-primary); }
      `}</style>

      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logo} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <div>
            <div className="topbar-l">Admin Panel</div>
            <div style={{ fontSize: '11px', color: '#5DCAA5', marginTop: '2px' }}>System Settings & Management</div>
          </div>
        </div>
      </header>

      <div className="nav-tabs">
        <div className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</div>
        <div className={`tab ${activeTab === 'schools' ? 'active' : ''}`} onClick={() => setActiveTab('schools')}>Schools</div>
        <div className={`tab ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>Maintenance</div>
      </div>

      <div className="body">
        {activeTab === 'users' && (
          <div className="card">
            <div className="card-head">
              <span>User Management</span>
              <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-text-secondary)' }}>{filteredUsers.length} total</span>
            </div>
            <input 
              type="text" 
              className="search-bar" 
              placeholder="Search by name or email..." 
              value={userSearch} 
              onChange={e => setUserSearch(e.target.value)} 
            />
            <div className="card-body">
              {loadingUsers ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No users found matching "{userSearch}".</div>
              ) : (
                filteredUsers.map(u => (
                  <div className="user-row" key={u.id}>
                    <div className="user-info">
                      <div className="avatar">
                        {u.email ? u.email.substring(0, 2).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="user-name">{u.name || 'Unknown User'}</div>
                        <div className="user-email">{u.email}</div>
                      </div>
                    </div>
                    <div className="actions">
                      <button className="btn-small" onClick={() => setEditUser(u)} title="Edit User">
                        <i className="ti ti-pencil"></i> Edit
                      </button>
                      <button className="btn-small" onClick={() => handlePasswordReset(u.email)} title="Send Password Reset Email">
                        <i className="ti ti-mail"></i> Reset Pwd
                      </button>
                      <select 
                        className="role-select" 
                        value={u.role || 'observer'} 
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="observer">Observer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'schools' && (
          <div className="card">
            <div className="card-head">
              <span>Dynamic School List</span>
              <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-text-secondary)' }}>{schools.length} total</span>
            </div>
            <form className="add-school-form" onSubmit={handleAddSchool} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px' }}>
              <input 
                type="text" 
                className="school-input" 
                placeholder="Circuit Name (e.g., North Circuit)..." 
                value={newCircuit} 
                onChange={e => setNewCircuit(e.target.value)} 
                required
              />
              <input 
                type="text" 
                className="school-input" 
                placeholder="Enter new school name..." 
                value={newSchool} 
                onChange={e => setNewSchool(e.target.value)} 
                required
              />
              <button type="submit" className="btn-primary">Add</button>
            </form>
            <div className="card-body">
              {loadingSchools ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading schools...</div>
              ) : schools.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No schools added yet.</div>
              ) : (
                schools.map(s => (
                  <div className="school-row" key={s.id}>
                    <div>
                      <div className="school-name">{s.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Circuit: {s.circuit || 'Unassigned'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-small" onClick={() => setEditSchool(s)}>
                        <i className="ti ti-pencil"></i> Edit
                      </button>
                      <button className="btn-small" style={{ color: '#A32D2D' }} onClick={() => handleDeleteSchool(s.id)}>
                        <i className="ti ti-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="card">
            <div className="card-head">
              <span>System Maintenance & Export</span>
            </div>
            <div className="stat-grid">
              <div className="stat-box">
                <div className="stat-val">{users.length}</div>
                <div className="stat-lbl">Registered Users</div>
              </div>
              <div className="stat-box">
                <div className="stat-val">{obsCount}</div>
                <div className="stat-lbl">Total Observations</div>
              </div>
            </div>
            <div className="card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn-primary" style={{ justifyContent: 'center' }} onClick={exportUsersCSV}>
                <i className="ti ti-download"></i> Export Users (CSV)
              </button>
              <button className="btn-primary" style={{ justifyContent: 'center', background: '#085041' }} onClick={exportObsCSV}>
                <i className="ti ti-download"></i> Export Observations (CSV)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Edit User</div>
                <div className="modal-subtitle">{editUser.email}</div>
              </div>
              <button className="modal-close" onClick={() => setEditUser(null)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="field-group">
                <label className="field-label">Name</label>
                <input type="text" className="field-input" value={editUser.name || ''} onChange={(e) => setEditUser({...editUser, name: e.target.value})} required />
              </div>
              <div className="field-group">
                <label className="field-label">Role</label>
                <select className="field-input" value={editUser.role || 'observer'} onChange={(e) => setEditUser({...editUser, role: e.target.value})}>
                  <option value="observer">Observer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setEditUser(null)} className="btn-small" style={{ padding: '10px 16px', fontSize: '13px' }}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit School Modal */}
      {editSchool && (
        <div className="modal-overlay" onClick={() => setEditSchool(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Edit School</div>
                <div className="modal-subtitle">Update school details</div>
              </div>
              <button className="modal-close" onClick={() => setEditSchool(null)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateSchool}>
              <div className="field-group">
                <label className="field-label">School Name</label>
                <input type="text" className="field-input" value={editSchool.name || ''} onChange={(e) => setEditSchool({...editSchool, name: e.target.value})} required />
              </div>
              <div className="field-group">
                <label className="field-label">Circuit Name</label>
                <input type="text" className="field-input" value={editSchool.circuit || ''} onChange={(e) => setEditSchool({...editSchool, circuit: e.target.value})} required />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setEditSchool(null)} className="btn-small" style={{ padding: '10px 16px', fontSize: '13px' }}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
