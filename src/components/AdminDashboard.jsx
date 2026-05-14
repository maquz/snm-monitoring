import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import logo from '../assets/logo.png';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "observations"), orderBy("submitted_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setObservations(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const stats = {
    total: observations.length,
    avgScore: observations.length ? Math.round(observations.reduce((acc, curr) => acc + curr.total_score, 0) / observations.length) : 0,
    schoolsCount: new Set(observations.map(o => o.school)).size,
    veryGoodPlus: observations.filter(o => o.total_score >= 65).length,
    gradeDist: {
      excellent: observations.filter(o => o.grade === 'Excellent').length,
      veryGood: observations.filter(o => o.grade === 'Very Good').length,
      good: observations.filter(o => o.grade === 'Good').length,
      needsImp: observations.filter(o => o.grade === 'Needs Improvement').length,
    }
  };

  const getIndicatorAvg = (section, key) => {
    if (!observations.length) return 0;
    const sum = observations.reduce((acc, curr) => acc + (curr[section]?.[key] || 0), 0);
    return (sum / observations.length).toFixed(1);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'schools', label: 'Schools' },
    { id: 'teachers', label: 'Teachers' },
    { id: 'analytics', label: 'Analytics' }
  ];

  return (
    <div className="dash">
      <style>{`
        .dash { background: var(--color-background-tertiary); min-height: 100vh; }
        .topbar { background: #085041; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
        .topbar-l { color: #9FE1CB; font-size: 13px; font-weight: 500; }
        .topbar-r { display: flex; align-items: center; gap: 8px; }
        .badge { background: #1D9E75; color: #E1F5EE; font-size: 11px; padding: 3px 9px; border-radius: 20px; font-weight: 500; }
        .nav-tabs { display: flex; gap: 2px; background: #0F6E56; padding: 0 12px; }
        .tab { padding: 10px 14px; font-size: 12px; color: #9FE1CB; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 500; letter-spacing: 0.03em; text-transform: uppercase; }
        .tab.active { color: #E1F5EE; border-bottom-color: #5DCAA5; }
        .body { padding: 12px; }
        .section { display: none; }
        .section.active { display: block; }
        .stat-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
        .stat { background: var(--color-background-primary); border-radius: var(--border-radius-md); padding: 12px; border: 0.5px solid var(--color-border-tertiary); }
        .stat-val { font-size: 24px; font-weight: 500; color: #0F6E56; }
        .stat-label { font-size: 11px; color: var(--color-text-secondary); margin-top: 3px; }
        .stat-delta { font-size: 11px; color: #1D9E75; margin-top: 2px; }
        .card { background: var(--color-background-primary); border-radius: var(--border-radius-lg); border: 0.5px solid var(--color-border-tertiary); margin-bottom: 10px; overflow: hidden; }
        .card-head { padding: 10px 14px; border-bottom: 0.5px solid var(--color-border-tertiary); font-size: 12px; font-weight: 500; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between; align-items: center; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; }
        .dash-logo-title { display: flex; align-items: center; gap: 12px; }
        .dash-logo { width: 48px; height: 48px; object-fit: contain; }
        .card-body { padding: 12px 14px; }
        .bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .bar-label { font-size: 12px; color: var(--color-text-primary); min-width: 90px; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bar-track { flex: 1; height: 8px; background: var(--color-background-secondary); border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; background: #1D9E75; transition: width 0.6s ease; }
        .bar-val { font-size: 12px; font-weight: 500; color: #0F6E56; min-width: 26px; text-align: right; }
        .school-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 0.5px solid var(--color-border-tertiary); }
        .school-name { font-size: 13px; font-weight: 500; color: var(--color-text-primary); }
        .school-meta { font-size: 11px; color: var(--color-text-secondary); margin-top: 2px; }
        .grade-chip { font-size: 11px; padding: 3px 9px; border-radius: 12px; font-weight: 500; }
        .chip-ex { background: #EAF3DE; color: #27500A; }
        .chip-vg { background: #E1F5EE; color: #085041; }
        .chip-gd { background: #FAEEDA; color: #633806; }
        .chip-ni { background: #FCEBEB; color: #A32D2D; }
        .donut-wrap { display: flex; align-items: center; gap: 12px; }
        .legend-item { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-size: 12px; }
        .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .teacher-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 0.5px solid var(--color-border-tertiary); }
        .avatar { width: 32px; height: 32px; border-radius: 50%; background: #E1F5EE; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 500; color: #085041; flex-shrink: 0; }
        .score-pill { margin-left: auto; font-size: 12px; font-weight: 500; padding: 3px 8px; border-radius: 10px; background: #EAF3DE; color: #27500A; }
        .score-pill.low { background: #FCEBEB; color: #A32D2D; }
        .score-pill.med { background: #FAEEDA; color: #633806; }
      `}</style>

      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logo} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <div>
            <div className="topbar-l">Monitoring Dashboard</div>
            <div style={{ fontSize: '11px', color: '#5DCAA5', marginTop: '2px' }}>GES Tema Metro · District Director</div>
          </div>
        </div>
        <div className="topbar-r">
          <div className="badge">Live Sync</div>
          <i className="ti ti-bell" style={{ fontSize: '18px', color: '#9FE1CB' }}></i>
        </div>
      </header>

      <div className="nav-tabs">
        {tabs.map(tab => (
          <div 
            key={tab.id} 
            className={`tab ${activeTab === tab.id ? 'active' : ''}`} 
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div className="body">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>Loading live data...</div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="section active">
                <div className="stat-row">
                  <div className="stat"><div className="stat-val">{stats.total}</div><div className="stat-label">Observations this term</div><div className="stat-delta">Real-time sync</div></div>
                  <div className="stat"><div className="stat-val">{stats.avgScore}<span style={{ fontSize: '14px' }}>/100</span></div><div className="stat-label">District avg score</div><div className="stat-delta">↑ From {observations.length} logs</div></div>
                  <div className="stat"><div className="stat-val">{stats.schoolsCount}</div><div className="stat-label">Schools monitored</div><div className="stat-delta">Active coverage</div></div>
                  <div className="stat"><div className="stat-val">{stats.total ? Math.round((stats.veryGoodPlus / stats.total) * 100) : 0}%</div><div className="stat-label">Teachers ≥ Very Good</div><div className="stat-delta">Target: 75%</div></div>
                </div>

                <div className="card">
                  <div className="card-head">Grade distribution</div>
                  <div className="card-body">
                    <div className="donut-wrap">
                      <svg width="90" height="90" viewBox="0 0 90 90">
                        <circle cx="45" cy="45" r="35" fill="none" stroke="#f0f0f0" strokeWidth="12"/>
                        {/* Simple CSS-based donut for demo; for production use a chart library or more complex SVG math */}
                        <circle cx="45" cy="45" r="35" fill="none" stroke="#1D9E75" strokeWidth="12" 
                          strokeDasharray={`${stats.total ? (stats.gradeDist.excellent / stats.total) * 220 : 0} 220`} transform="rotate(-90 45 45)"/>
                        <text x="45" y="48" textAnchor="middle" fontSize="13" fontWeight="500" fill="#0F6E56">{stats.total}</text>
                      </svg>
                      <div className="donut-legend">
                        <div className="legend-item"><div className="legend-dot" style={{ background: '#1D9E75' }}></div><span style={{ flex: 1 }}>Excellent</span><strong>{stats.gradeDist.excellent}</strong></div>
                        <div className="legend-item"><div className="legend-dot" style={{ background: '#5DCAA5' }}></div><span style={{ flex: 1 }}>Very Good</span><strong>{stats.gradeDist.veryGood}</strong></div>
                        <div className="legend-item"><div className="legend-dot" style={{ background: '#EF9F27' }}></div><span style={{ flex: 1 }}>Good</span><strong>{stats.gradeDist.good}</strong></div>
                        <div className="legend-item"><div className="legend-dot" style={{ background: '#E24B4A' }}></div><span style={{ flex: 1 }}>Needs Improvement</span><strong>{stats.gradeDist.needsImp}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-head">Weakest indicators (Section B)</div>
                  <div className="card-body">
                    <div className="bar-row">
                      <div className="bar-label">Critical thinking</div>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${(getIndicatorAvg('B', 'critical') / 5) * 100}%`, background: '#E24B4A' }}></div></div>
                      <div className="bar-val" style={{ color: '#A32D2D' }}>{getIndicatorAvg('B', 'critical')}</div>
                    </div>
                    <div className="bar-row">
                      <div className="bar-label">Use of TLRs</div>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${(getIndicatorAvg('B', 'tlr') / 5) * 100}%`, background: '#EF9F27' }}></div></div>
                      <div className="bar-val" style={{ color: '#633806' }}>{getIndicatorAvg('B', 'tlr')}</div>
                    </div>
                    <div className="bar-row">
                      <div className="bar-label">Gender balance</div>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${(getIndicatorAvg('B', 'gender') / 5) * 100}%`, background: '#EF9F27' }}></div></div>
                      <div className="bar-val" style={{ color: '#633806' }}>{getIndicatorAvg('B', 'gender')}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schools' && (
              <div className="section active">
                <div className="card">
                  <div className="card-head">Recent School Activity</div>
                  <div className="card-body">
                    {observations.length === 0 ? (
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>No observations recorded yet.</div>
                    ) : (
                      observations.slice(0, 10).map(o => (
                        <div className="school-row" key={o.id}>
                          <div>
                            <div className="school-name">{o.school}</div>
                            <div className="school-meta">{o.subject} &middot; {o.teacher}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className={`grade-chip ${o.total_score >= 80 ? 'chip-ex' : o.total_score >= 65 ? 'chip-vg' : o.total_score >= 50 ? 'chip-gd' : 'chip-ni'}`}>
                              {o.grade}
                            </div>
                            <div style={{ fontSize: '12px', color: '#0F6E56', marginTop: '3px', fontWeight: 500 }}>{o.total_score}/100</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'teachers' && (
              <div className="section active">
                <div className="card">
                  <div className="card-head">Recent Performers</div>
                  <div className="card-body">
                    {observations.length === 0 ? (
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>No data available.</div>
                    ) : (
                      observations.map(o => (
                        <div className="teacher-row" key={o.id}>
                          <div className="avatar">{o.teacher.split(' ').map(n => n[0]).join('')}</div>
                          <div>
                            <div className="teacher-name">{o.teacher}</div>
                            <div className="teacher-school">{o.school} &middot; {o.subject}</div>
                          </div>
                          <div className={`score-pill ${o.total_score < 50 ? 'low' : o.total_score < 65 ? 'med' : ''}`}>
                            {o.total_score}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="section active">
                <div className="card">
                  <div className="card-head">Average score by section</div>
                  <div className="card-body">
                    <div className="bar-row">
                      <div className="bar-label">A. Planning</div>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${observations.length ? (observations.reduce((a,c)=>a+c.score_a,0)/observations.length/15)*100 : 0}%` }}></div></div>
                      <div className="bar-val">{(observations.reduce((a,c)=>a+c.score_a,0)/(observations.length || 1)).toFixed(1)}</div>
                    </div>
                    <div className="bar-row">
                      <div className="bar-label">B. Instructional</div>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${observations.length ? (observations.reduce((a,c)=>a+c.score_a,0)/observations.length/55)*100 : 0}%` }}></div></div>
                      <div className="bar-val">{(observations.reduce((a,c)=>a+c.score_b,0)/(observations.length || 1)).toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
