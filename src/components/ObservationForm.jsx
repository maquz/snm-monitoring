import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import logo from '../assets/logo.png';

const steps = [
  { label: "Basic Info" },
  { label: "Planning & Preparation (A)" },
  { label: "Instructional Skills (B)" },
  { label: "Class Management (C)" },
  { label: "Assessment (D)" },
  { label: "Comments" },
  { label: "Review & Submit" }
];

const ObservationForm = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    school: "", teacher: "", sex: "", subject: "", cls: "", roll: "", date: "", start: "", end: "",
    A: { plan_align: 0, indicators: 0, rpk: 0 },
    B: { intro: 0, clarity: 0, strategy: 0, motivation: 0, structure: 0, mastery: 0, questioning: 0, gender: 0, tlr: 0, critical: 0, involvement: 0 },
    C: { rapport: 0, appearance: 0, output: 0, environment: 0 },
    D: { evaluation: 0, time_mgmt: 0 },
    comments: "", areas: "", monitorName: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const score = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);
  const totalScore = () => score(formData.A) + score(formData.B) + score(formData.C) + score(formData.D);

  const getGrade = (s) => {
    if (s >= 80) return { g: "Excellent", c: "#27500A", bg: "#EAF3DE" };
    if (s >= 65) return { g: "Very Good", c: "#085041", bg: "#E1F5EE" };
    if (s >= 50) return { g: "Good", c: "#633806", bg: "#FAEEDA" };
    return { g: "Needs Improvement", c: "#A32D2D", bg: "#FCEBEB" };
  };

  const setRating = (key, subkey, val) => {
    setFormData(prev => ({
      ...prev,
      [key]: { ...prev[key], [subkey]: val }
    }));
  };

  const isStepValid = () => {
    if (step === 0) {
      return formData.school && formData.teacher && formData.sex && formData.subject && formData.cls && formData.roll && formData.date && formData.start && formData.end;
    }
    if (step >= 1 && step <= 4) {
      const keys = ["A", "B", "C", "D"];
      const currentSection = formData[keys[step - 1]];
      return Object.values(currentSection).every(val => val > 0);
    }
    if (step === 5) {
      return formData.comments && formData.areas && formData.monitorName;
    }
    return true;
  };

  const handleNext = () => {
    if (!isStepValid()) {
      alert("Please fill in all required fields and provide ratings for all indicators before proceeding.");
      return;
    }
    if (step < steps.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!isStepValid()) {
      alert("Please complete the review before submitting.");
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const total = totalScore();
      const grade = getGrade(total).g;
      
      const payload = {
        ...formData,
        score_a: score(formData.A),
        score_b: score(formData.B),
        score_c: score(formData.C),
        score_d: score(formData.D),
        total_score: total,
        grade: grade,
        submitted_at: serverTimestamp()
      };

      await addDoc(collection(db, "observations"), payload);
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting observation:", err);
      setError("Failed to submit observation. Please check your connection and Firebase configuration.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      school: "", teacher: "", sex: "", subject: "", cls: "", roll: "", date: "", start: "", end: "",
      A: { plan_align: 0, indicators: 0, rpk: 0 },
      B: { intro: 0, clarity: 0, strategy: 0, motivation: 0, structure: 0, mastery: 0, questioning: 0, gender: 0, tlr: 0, critical: 0, involvement: 0 },
      C: { rapport: 0, appearance: 0, output: 0, environment: 0 },
      D: { evaluation: 0, time_mgmt: 0 },
      comments: "", areas: "", monitorName: ""
    });
    setStep(0);
    setSubmitted(false);
  };

  const renderRatingBlock = (key, subkey, title, desc, max = 5) => {
    const val = formData[key][subkey] || 0;
    return (
      <div className="rating-block" key={subkey}>
        <div className="rating-title">{title}</div>
        {desc && <div className="rating-desc">{desc}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', marginBottom: '4px', padding: '0 4px' }}>
          <span>1: Lowest</span>
          <span>5: Highest</span>
        </div>
        <div className="stars">
          {Array.from({ length: max }, (_, i) => {
            const n = i + 1;
            let cls = "star";
            if (n <= val) {
              if (val <= Math.ceil(max * 0.35)) cls += " sel-low";
              else if (val <= Math.ceil(max * 0.65)) cls += " sel-mid";
              else cls += " sel";
            }
            return (
              <div 
                key={n} 
                className={cls} 
                onClick={() => setRating(key, subkey, n)}
              >
                {n}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (submitted) {
    const total = totalScore();
    const g = getGrade(total);
    const sections = [
      { label: "A. Planning & Prep", score: score(formData.A), max: 15 },
      { label: "B. Instructional Skills", score: score(formData.B), max: 55 },
      { label: "C. Class Management", score: score(formData.C), max: 20 },
      { label: "D. Assessment", score: score(formData.D), max: 10 },
    ];

    const sectionDetails = {
      A: [
        { key: 'plan_align', label: 'Lesson plan aligns with curriculum' },
        { key: 'indicators', label: 'Indicators/objectives clearly stated' },
        { key: 'rpk', label: 'RPK adequately considered' },
      ],
      B: [
        { key: 'intro', label: 'Child-centred introduction' },
        { key: 'clarity', label: 'Clarity of instruction' },
        { key: 'strategy', label: 'Teaching strategies used' },
        { key: 'motivation', label: 'Learner motivation' },
        { key: 'structure', label: 'Lesson structure & pacing' },
        { key: 'mastery', label: 'Subject mastery' },
        { key: 'questioning', label: 'Questioning skills' },
        { key: 'gender', label: 'Gender balance' },
        { key: 'tlr', label: 'Use of TLRs' },
        { key: 'critical', label: 'Critical thinking promoted' },
        { key: 'involvement', label: 'Learner involvement' },
      ],
      C: [
        { key: 'rapport', label: 'Rapport with learners' },
        { key: 'appearance', label: 'Facilitator appearance' },
        { key: 'output', label: 'Learner output' },
        { key: 'environment', label: 'Classroom environment' },
      ],
      D: [
        { key: 'evaluation', label: 'Lesson evaluation' },
        { key: 'time_mgmt', label: 'Time management' },
      ],
    };

    const handlePrint = () => {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Observation Report — ${formData.teacher}</title>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 28px 32px; font-size: 13px; }
              .header { display: flex; align-items: center; gap: 16px; border-bottom: 2.5px solid #0F6E56; padding-bottom: 14px; margin-bottom: 20px; }
              .header img { width: 56px; height: 56px; object-fit: contain; }
              .header h1 { font-size: 17px; color: #0F6E56; font-weight: 700; margin-bottom: 3px; }
              .header p { font-size: 11px; color: #555; }
              .grade-block { text-align: center; padding: 16px; border-radius: 10px; margin-bottom: 18px; background: ${g.bg}; }
              .grade-num { font-size: 44px; font-weight: 700; color: ${g.c}; line-height: 1; }
              .grade-num span { font-size: 20px; }
              .grade-text { font-size: 16px; color: ${g.c}; font-weight: 600; margin-top: 4px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
              .info-box { border: 1px solid #ddd; border-radius: 8px; padding: 10px 12px; }
              .info-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
              .info-value { font-size: 13px; font-weight: 600; color: #1a1a1a; }
              .scores-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 18px; }
              .score-box { border: 1px solid #ddd; border-radius: 8px; padding: 10px; text-align: center; }
              .score-val { font-size: 20px; font-weight: 700; color: #0F6E56; }
              .score-lbl { font-size: 10px; color: #666; margin-top: 3px; text-transform: uppercase; }
              h2 { font-size: 12px; font-weight: 700; color: #0F6E56; text-transform: uppercase; letter-spacing: 0.06em; border-left: 3px solid #0F6E56; padding-left: 8px; margin: 16px 0 8px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 12px; }
              thead tr { background: #0F6E56; color: #fff; }
              th { padding: 7px 10px; text-align: left; font-size: 11px; font-weight: 600; }
              td { padding: 6px 10px; border-bottom: 0.5px solid #eee; }
              tr:nth-child(even) td { background: #f9f9f9; }
              .rating-dots { display: flex; gap: 3px; }
              .dot { width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid #ccc; display: inline-block; }
              .dot.filled { background: #0F6E56; border-color: #0F6E56; }
              .comment-box { border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin-bottom: 10px; min-height: 60px; font-size: 12px; color: #333; }
              .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 10px; color: #888; }
              @media print { @page { size: A4 portrait; margin: 15mm; } body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="${window.location.origin}/src/assets/logo.png" onerror="this.style.display='none'" alt="GES Logo" />
              <div>
                <h1>Lesson Observation Report</h1>
                <p>Ghana Education Service &mdash; Tema Metropolis</p>
                <p>Date of Visit: ${formData.date} &nbsp;&bull;&nbsp; Time: ${formData.start} &ndash; ${formData.end}</p>
              </div>
            </div>

            <div class="grade-block">
              <div class="grade-num">${total}<span>/100</span></div>
              <div class="grade-text">${g.g}</div>
            </div>

            <div class="info-grid">
              <div class="info-box"><div class="info-label">Teacher</div><div class="info-value">${formData.teacher}</div></div>
              <div class="info-box"><div class="info-label">Sex</div><div class="info-value">${formData.sex || '—'}</div></div>
              <div class="info-box"><div class="info-label">School</div><div class="info-value">${formData.school}</div></div>
              <div class="info-box"><div class="info-label">Class</div><div class="info-value">${formData.cls}</div></div>
              <div class="info-box"><div class="info-label">Subject</div><div class="info-value">${formData.subject}</div></div>
              <div class="info-box"><div class="info-label">Roll</div><div class="info-value">${formData.roll}</div></div>
              <div class="info-box"><div class="info-label">Monitor</div><div class="info-value">${formData.monitorName}</div></div>
              <div class="info-box"><div class="info-label">Date</div><div class="info-value">${formData.date}</div></div>
            </div>

            <div class="scores-grid">
              <div class="score-box"><div class="score-val">${score(formData.A)}/15</div><div class="score-lbl">A. Planning</div></div>
              <div class="score-box"><div class="score-val">${score(formData.B)}/55</div><div class="score-lbl">B. Instructional</div></div>
              <div class="score-box"><div class="score-val">${score(formData.C)}/20</div><div class="score-lbl">C. Class Mgmt</div></div>
              <div class="score-box"><div class="score-val">${score(formData.D)}/10</div><div class="score-lbl">D. Assessment</div></div>
            </div>

            ${['A','B','C','D'].map(sec => {
              const labels = { A: 'Section A — Planning & Preparation (Max: 15)', B: 'Section B — Instructional Skills (Max: 55)', C: 'Section C — Class Management (Max: 20)', D: 'Section D — Assessment (Max: 10)' };
              const items = sectionDetails[sec];
              return `
                <h2>${labels[sec]}</h2>
                <table>
                  <thead><tr><th>Indicator</th><th>Rating (1–5)</th><th>Score</th></tr></thead>
                  <tbody>
                    ${items.map(item => {
                      const val = formData[sec][item.key] || 0;
                      const dots = Array.from({length:5}, (_,i) => `<span class="dot ${i < val ? 'filled' : ''}"></span>`).join('');
                      return `<tr><td>${item.label}</td><td><div class="rating-dots">${dots}</div></td><td><strong>${val}</strong>/5</td></tr>`;
                    }).join('')}
                  </tbody>
                </table>
              `;
            }).join('')}

            <h2>Observer's Comments</h2>
            <div class="comment-box">${formData.comments || 'No comments recorded.'}</div>

            <h2>Areas for Improvement</h2>
            <div class="comment-box">${formData.areas || 'None specified.'}</div>

            <div class="footer">
              <span>GES Tema Metropolis &mdash; Lesson Observation Form</span>
              <span>Monitor: ${formData.monitorName}</span>
              <span>Confidential &mdash; Official Use Only</span>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); }, 600);
    };

    return (
      <div className="form-page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px 12px', background: 'var(--color-background-tertiary)' }}>
        <div className="shell" style={{ width: '100%', maxWidth: '400px' }}>
          <div className="topbar">
            <div>
              <div className="topbar-title">Observation Summary</div>
              <div className="topbar-sub">Ghana Education Service · Tema Metro</div>
            </div>
          </div>
          <div className="content">
            <div className="submitted" style={{ padding: '0 0 16px 0' }}>
              <div className="check-circle"><i className="ti ti-check" style={{ fontSize: '28px' }}></i></div>
              <div className="sub-title">Submission Successful</div>
            </div>

            <div className="grade-badge" style={{ background: g.bg }}>
              <div className="grade-val" style={{ color: g.c }}>{total}<span style={{ fontSize: '16px' }}>/100</span></div>
              <div className="grade-label" style={{ color: g.c }}>{g.g}</div>
            </div>

            <div className="score-summary">
              {sections.map(s => (
                <div key={s.label} className="score-card">
                  <div className="score-card-val">{s.score}/{s.max}</div>
                  <div className="score-card-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '12px', marginBottom: '12px', fontSize: '13px' }}>
              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Teacher &amp; School</div>
              <div style={{ fontWeight: 500 }}>{formData.teacher} &middot; {formData.school}</div>
              <div style={{ color: 'var(--color-text-secondary)', marginTop: '6px', marginBottom: '4px' }}>Monitor</div>
              <div style={{ fontWeight: 500 }}>{formData.monitorName}</div>
              <div style={{ color: 'var(--color-text-secondary)', marginTop: '6px', marginBottom: '4px' }}>Date</div>
              <div style={{ fontWeight: 500 }}>{formData.date}</div>
            </div>

            <div className="field-group">
              <div className="field-label">Areas for Improvement</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', background: 'var(--color-background-secondary)', padding: '10px', borderRadius: 'var(--border-radius-md)', border: '0.5px solid var(--color-border-tertiary)' }}>
                {formData.areas}
              </div>
            </div>

            {/* Action buttons */}
            <button
              onClick={handlePrint}
              style={{ width: '100%', padding: '11px', marginBottom: '10px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 'var(--border-radius-md)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <i className="ti ti-printer" style={{ fontSize: '16px' }}></i>
              Print / Save as PDF
            </button>
            <button className="new-btn" style={{ marginTop: 0 }} onClick={resetForm}>Start New Observation</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page-wrapper">
      <div className="shell">
      <style>{`
        .form-page-wrapper { 
          display: flex; 
          flex: 1;
          align-items: center; 
          justify-content: center; 
          padding: 20px 12px;
        }
        .shell { background: var(--color-background-primary); border-radius: var(--border-radius-lg); border: 0.5px solid var(--color-border-tertiary); overflow: hidden; width: 100%; max-width: 400px; margin: 0 auto; }
        .topbar { background: #0F6E56; padding: 10px 16px; display: flex; align-items: center; gap: 12px; }
        .topbar-logo { width: 40px; height: 40px; object-fit: contain; flex-shrink: 0; }
        .topbar-title { color: #E1F5EE; font-size: 15px; font-weight: 500; }
        .topbar-sub { color: #9FE1CB; font-size: 12px; }
        .progress-track { height: 3px; background: #0F6E56; }
        .progress-bar { height: 3px; background: #5DCAA5; transition: width 0.4s ease; }
        .step-indicator { display: flex; gap: 4px; padding: 10px 16px; background: #085041; }
        .dot { height: 6px; border-radius: 3px; background: #1D9E75; transition: all 0.3s; flex: 1; }
        .dot.active { background: #9FE1CB; }
        .dot.done { background: #5DCAA5; }
        .step-label { color: #9FE1CB; font-size: 11px; padding: 0 16px 10px; background: #085041; text-transform: uppercase; letter-spacing: 0.05em; }
        .content { padding: 16px; max-height: 500px; overflow-y: auto; }
        .field-group { margin-bottom: 14px; }
        .field-label { font-size: 12px; color: var(--color-text-secondary); margin-bottom: 4px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
        .field-input { width: 100%; padding: 9px 12px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); font-size: 14px; background: var(--color-background-primary); color: var(--color-text-primary); }
        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .rating-block { background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: 12px; margin-bottom: 10px; border: 0.5px solid var(--color-border-tertiary); }
        .rating-title { font-size: 13px; font-weight: 500; color: var(--color-text-primary); margin-bottom: 6px; line-height: 1.3; }
        .rating-desc { font-size: 11px; color: var(--color-text-secondary); margin-bottom: 8px; }
        .stars { display: flex; gap: 6px; }
        .star { width: 36px; height: 36px; border-radius: var(--border-radius-md); border: 0.5px solid var(--color-border-secondary); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; cursor: pointer; background: var(--color-background-primary); color: var(--color-text-secondary); transition: all 0.15s; user-select: none; flex: 1; }
        .star.sel { background: #1D9E75; color: #fff; border-color: #1D9E75; }
        .star.sel-low { background: #E24B4A; color: #fff; border-color: #E24B4A; }
        .star.sel-mid { background: #EF9F27; color: #fff; border-color: #EF9F27; }
        .nav { display: flex; gap: 8px; padding: 12px 16px; border-top: 0.5px solid var(--color-border-tertiary); }
        .btn-back { flex: 1; padding: 11px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); background: var(--color-background-primary); color: var(--color-text-secondary); font-size: 14px; cursor: pointer; }
        .btn-next { flex: 2; padding: 11px; border: none; border-radius: var(--border-radius-md); background: #0F6E56; color: #fff; font-size: 14px; font-weight: 500; cursor: pointer; }
        .score-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
        .score-card { background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: 10px; text-align: center; }
        .score-card-val { font-size: 22px; font-weight: 500; color: #0F6E56; }
        .score-card-label { font-size: 11px; color: var(--color-text-secondary); margin-top: 2px; }
        .grade-badge { text-align: center; padding: 14px; background: #EAF3DE; border-radius: var(--border-radius-md); margin-bottom: 12px; }
        .grade-val { font-size: 32px; font-weight: 500; color: #27500A; }
        .grade-label { font-size: 13px; color: #3B6D11; margin-top: 2px; }
        .comments-area { width: 100%; min-height: 80px; padding: 10px 12px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); font-size: 14px; background: var(--color-background-primary); color: var(--color-text-primary); resize: none; }
        .submitted { text-align: center; padding: 24px 16px; }
        .check-circle { width: 56px; height: 56px; border-radius: 50%; background: #EAF3DE; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 24px; color: #0F6E56; }
        .sub-title { font-size: 18px; font-weight: 500; color: var(--color-text-primary); margin-bottom: 6px; }
        .sub-sub { font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; }
        .new-btn { margin-top: 16px; padding: 11px 24px; background: #0F6E56; color: #fff; border: none; border-radius: var(--border-radius-md); font-size: 14px; cursor: pointer; width: 100%; }
      `}</style>

      <div className="topbar">
        <img src={logo} alt="Logo" className="topbar-logo" />
        <div>
          <div className="topbar-title">Lesson Observation</div>
          <div className="topbar-sub">Ghana Education Service · Tema Metro</div>
        </div>
      </div>
      <div className="progress-track">
        <div className="progress-bar" style={{ width: `${Math.round((step + 1) / steps.length * 100)}%` }}></div>
      </div>
      <div className="step-indicator">
        {steps.map((_, i) => (
          <div key={i} className={`dot ${i < step ? "done" : i === step ? "active" : ""}`}></div>
        ))}
      </div>
      <div className="step-label">Step {step + 1} of {steps.length} — {steps[step].label}</div>
      
      <div className="content">
        {step === 0 && (
          <>
            <div className="field-group">
              <div className="field-label">School Name <span style={{ color: '#A32D2D' }}>*</span></div>
              <select required className="field-input" value={formData.school} onChange={e => setFormData({ ...formData, school: e.target.value })}>
                <option value="">— Select School —</option>
                <option>ADJETEY ANSAH JHS</option>
                <option>AKODZO JHS</option>
                <option>ARCHBISHOP ANDOH R/C BASIC</option>
                <option>COMMUNITY 1 PRESBY PRIMARY</option>
                <option>COMMUNITY 11 COMPLEX JHS</option>
                <option>COMMUNITY 11 COMPLEX PRIM B&amp;KG</option>
                <option>COMMUNITY 11 COMPLEX PRIMARY 'A' &amp; KG</option>
                <option>COMMUNITY 4 NO 2 PRIMARY/KG</option>
                <option>COMMUNITY 7 N0 1 BASIC</option>
                <option>COMMUNITY 7 NO 2 JHS</option>
                <option>COMMUNITY 7 NO. 2 PRIMARY</option>
                <option>COMMUNITY 8 NO 3 JHS</option>
                <option>COMMUNITY 8 NO 4 JHS</option>
                <option>COMMUNITY 8 NO.1 PRIMARY SCHOOL</option>
                <option>COMMUNITY 8 NO.4 PRIMARY</option>
                <option>COMMUNITY 8/1 JHS</option>
                <option>COMMUNITY 8/3 PRIMARY</option>
                <option>LORENZ WOLF JHS</option>
                <option>MANHEAN ANGLICAN 'A&amp;B' PRIMARY</option>
                <option>MANHEAN ANGLICAN 'D' PRIMARY</option>
                <option>MANHEAN ANGLICAN JHS</option>
                <option>MANHEAN ANGLICAN PRIMARY 'C'</option>
                <option>MANHEAN COMMUNITY PRIMARY</option>
                <option>MANHEAN METHODIST BASIC SCH</option>
                <option>MANHEAN PRESBY PRIMARY 'A'</option>
                <option>MANHEAN S.D.A. BASIC SCHOOL</option>
                <option>MANHEAN T.M.A 'B' PRIMARY</option>
                <option>MANHEAN TMA '1' JHS</option>
                <option>MANHEAN TMA 2 JHS</option>
                <option>MANHEAN TMA A PRIMARY</option>
                <option>NAVAL BASE JHS</option>
                <option>NAVAL BASE KG</option>
                <option>NAVAL BASE PRIMARY SCHOOL</option>
                <option>NAYLOR SDA JHS</option>
                <option>ONINKU DRIVE 1 JHS</option>
                <option>ONINKU DRIVE '2' JHS</option>
                <option>ONINKU DRIVE PRIMARY</option>
                <option>PADMORE STREET PRIMARY</option>
                <option>RAHMANIYYA ISLAMIC BASIC SCHOOL</option>
                <option>REDEMPTION VALLEY BASIC</option>
                <option>REPUBLIC ROAD JHS</option>
                <option>REPUBLIC ROAD PRIMARY</option>
                <option>ST PETER RC BASIC SCHOOL</option>
                <option>ST. ALBAN ANGLICAN BASIC SCHOOL</option>
                <option>ST. PAUL METHODIST JHS</option>
                <option>TEMA COMMUNITY 8/2 JHS</option>
                <option>TEMA MANHEAN PRESBYTERIAN PRIMARY B</option>
                <option>TWEDAASE JHS</option>
                <option>TWEDAASE PRIMARY B</option>
              </select>
            </div>
            <div className="row2">
              <div className="field-group">
                <div className="field-label">Teacher Name <span style={{ color: '#A32D2D' }}>*</span></div>
                <input required className="field-input" value={formData.teacher} onChange={e => setFormData({ ...formData, teacher: e.target.value })} placeholder="Full name" />
              </div>
              <div className="field-group">
                <div className="field-label">Sex <span style={{ color: '#A32D2D' }}>*</span></div>
                <select required className="field-input" value={formData.sex} onChange={e => setFormData({ ...formData, sex: e.target.value })}>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
            </div>
            <div className="row2">
              <div className="field-group">
                <div className="field-label">Subject <span style={{ color: '#A32D2D' }}>*</span></div>
                <input required className="field-input" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g. Mathematics" />
              </div>
              <div className="field-group">
                <div className="field-label">Class <span style={{ color: '#A32D2D' }}>*</span></div>
                <input required className="field-input" value={formData.cls} onChange={e => setFormData({ ...formData, cls: e.target.value })} placeholder="e.g. JHS 2A" />
              </div>
            </div>
            <div className="field-group">
              <div className="field-label">No. on Roll <span style={{ color: '#A32D2D' }}>*</span></div>
              <input required className="field-input" type="number" value={formData.roll} onChange={e => setFormData({ ...formData, roll: e.target.value })} placeholder="0" />
            </div>
            <div className="field-group">
              <div className="field-label">Date <span style={{ color: '#A32D2D' }}>*</span></div>
              <input required className="field-input" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div className="row2">
              <div className="field-group">
                <div className="field-label">Start Time <span style={{ color: '#A32D2D' }}>*</span></div>
                <input required className="field-input" type="time" value={formData.start} onChange={e => setFormData({ ...formData, start: e.target.value })} />
              </div>
              <div className="field-group">
                <div className="field-label">End Time <span style={{ color: '#A32D2D' }}>*</span></div>
                <input required className="field-input" type="time" value={formData.end} onChange={e => setFormData({ ...formData, end: e.target.value })} />
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            {renderRatingBlock("A", "plan_align", "Lesson plan aligns with curriculum", "Does the lesson plan reflect the curriculum standards?")}
            {renderRatingBlock("A", "indicators", "Indicators/objectives clearly stated", "Are learning indicators well-defined in the plan?")}
            {renderRatingBlock("A", "rpk", "RPK adequately considered", "Is prior knowledge (RPK) incorporated?")}
            <div style={{ background: 'var(--color-background-secondary)', padding: '10px 12px', borderRadius: 'var(--border-radius-md)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Section A score: <strong style={{ color: '#0F6E56' }}>{score(formData.A)} / 15</strong>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {renderRatingBlock("B", "intro", "Child-centred introduction", "Lesson starts with learner engagement")}
            {renderRatingBlock("B", "clarity", "Clarity of instruction", "Instructions are clear and understandable")}
            {renderRatingBlock("B", "strategy", "Teaching strategies used", "Variety of strategies appropriate to topic")}
            {renderRatingBlock("B", "motivation", "Learner motivation", "Students are engaged and motivated")}
            {renderRatingBlock("B", "structure", "Lesson structure & pacing", "Logical flow from intro to close")}
            {renderRatingBlock("B", "mastery", "Subject mastery", "Teacher demonstrates content knowledge")}
            {renderRatingBlock("B", "questioning", "Questioning skills", "Questions promote higher-order thinking")}
            {renderRatingBlock("B", "gender", "Gender balance", "Equal participation across genders")}
            {renderRatingBlock("B", "tlr", "Use of TLRs", "Teaching/learning resources used effectively")}
            {renderRatingBlock("B", "critical", "Critical thinking promoted", "Students encouraged to analyse and evaluate")}
            {renderRatingBlock("B", "involvement", "Learner involvement", "All learners actively participate")}
            <div style={{ background: 'var(--color-background-secondary)', padding: '10px 12px', borderRadius: 'var(--border-radius-md)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Section B score: <strong style={{ color: '#0F6E56' }}>{score(formData.B)} / 55</strong>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            {renderRatingBlock("C", "rapport", "Rapport with learners", "Positive, respectful relationship with students")}
            {renderRatingBlock("C", "appearance", "Facilitator appearance", "Professional and appropriate presentation")}
            {renderRatingBlock("C", "output", "Learner output", "Quality and quantity of student work produced")}
            {renderRatingBlock("C", "environment", "Classroom environment", "Organised, safe and stimulating environment")}
            <div style={{ background: 'var(--color-background-secondary)', padding: '10px 12px', borderRadius: 'var(--border-radius-md)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Section C score: <strong style={{ color: '#0F6E56' }}>{score(formData.C)} / 20</strong>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            {renderRatingBlock("D", "evaluation", "Lesson evaluation", "Teacher assesses learning at end of lesson")}
            {renderRatingBlock("D", "time_mgmt", "Time management", "Lesson paced well within allocated time")}
            <div style={{ background: 'var(--color-background-secondary)', padding: '10px 12px', borderRadius: 'var(--border-radius-md)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Section D score: <strong style={{ color: '#0F6E56' }}>{score(formData.D)} / 10</strong>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <div className="field-group">
              <div className="field-label">Observer's Comments <span style={{ color: '#A32D2D' }}>*</span></div>
              <textarea required className="comments-area" placeholder="General observations about the lesson..." value={formData.comments} onChange={e => setFormData({ ...formData, comments: e.target.value })} />
            </div>
            <div className="field-group">
              <div className="field-label">Areas for Improvement <span style={{ color: '#A32D2D' }}>*</span></div>
              <textarea required className="comments-area" placeholder="Specific areas the teacher should work on..." value={formData.areas} onChange={e => setFormData({ ...formData, areas: e.target.value })} />
            </div>
            <div className="field-group">
              <div className="field-label">Name of Monitor <span style={{ color: '#A32D2D' }}>*</span></div>
              <input required className="field-input" placeholder="Your full name" value={formData.monitorName} onChange={e => setFormData({ ...formData, monitorName: e.target.value })} />
            </div>
          </>
        )}

        {step === 6 && (
          <>
            {(() => {
              const total = totalScore();
              const g = getGrade(total);
              const sections = [
                { label: "A. Planning & Prep", score: score(formData.A), max: 15 },
                { label: "B. Instructional", score: score(formData.B), max: 55 },
                { label: "C. Class Mgmt", score: score(formData.C), max: 20 },
                { label: "D. Assessment", score: score(formData.D), max: 10 },
              ];
              return (
                <>
                  <div className="grade-badge" style={{ background: g.bg }}>
                    <div className="grade-val" style={{ color: g.c }}>{total}<span style={{ fontSize: '16px' }}>/100</span></div>
                    <div className="grade-label" style={{ color: g.c }}>{g.g}</div>
                  </div>
                  <div className="score-summary">
                    {sections.map(s => (
                      <div key={s.label} className="score-card">
                        <div className="score-card-val">{s.score}/{s.max}</div>
                        <div className="score-card-label">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '12px', marginBottom: '12px', fontSize: '13px' }}>
                    <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Teacher</div>
                    <div style={{ fontWeight: 500 }}>{formData.teacher || "—"} &middot; {formData.school || "—"}</div>
                    <div style={{ color: 'var(--color-text-secondary)', marginTop: '6px', marginBottom: '4px' }}>Class &amp; Subject</div>
                    <div style={{ fontWeight: 500 }}>{formData.cls || "—"} &middot; {formData.subject || "—"}</div>
                    <div style={{ color: 'var(--color-text-secondary)', marginTop: '6px', marginBottom: '4px' }}>Date &amp; Time</div>
                    <div style={{ fontWeight: 500 }}>{formData.date || "—"} &nbsp; {formData.start || ""} – {formData.end || ""}</div>
                  </div>
                  {error && (
                    <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '12px', borderRadius: 'var(--border-radius-md)', fontSize: '12px', marginBottom: '12px', border: '0.5px solid #A32D2D' }}>
                      {error}
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}
      </div>

      <div className="nav">
        {step > 0 && <button className="btn-back" disabled={loading} onClick={handleBack}>Back</button>}
        {step < steps.length - 1 ? (
          <button className="btn-next" onClick={handleNext}>Next →</button>
        ) : (
          <button className="btn-next" disabled={loading} onClick={handleSubmit}>
            {loading ? "Submitting..." : "Submit Observation"}
          </button>
        )}
      </div>
      </div>
    </div>
  );
};

export default ObservationForm;
