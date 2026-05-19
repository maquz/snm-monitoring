import html2pdf from 'html2pdf.js';

export const generateAndSharePDF = async (formData, total, g, score) => {
  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 32px 40px; font-size: 13px; max-width: 860px; margin: 0 auto; box-sizing: border-box;">
        <div style="border-bottom: 2.5px solid #0F6E56; padding-bottom: 14px; margin-bottom: 24px; box-sizing: border-box;">
          <h1 style="font-size: 20px; color: #0F6E56; font-weight: 700; margin-bottom: 4px; margin-top: 0;">Lesson Observation Report</h1>
          <p style="font-size: 12px; color: #555; margin-top: 2px;">Ghana Education Service &mdash; Tema Metropolis</p>
          <p style="font-size: 12px; color: #555;">Date of Visit: ${formData.date} &bull; Time: ${formData.start} &ndash; ${formData.end}</p>
        </div>
        <div style="text-align: center; padding: 28px 16px; border-radius: 12px; margin-bottom: 24px; background: ${g.bg}; box-sizing: border-box;">
          <span style="font-size: 52px; font-weight: 700; color: ${g.c}; line-height: 1;">${total}</span><span style="font-size: 22px; color: ${g.c}; font-weight: 400;">/100</span>
          <div style="font-size: 18px; color: ${g.c}; font-weight: 600; margin-top: 8px;">${g.g}</div>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; box-sizing: border-box;">
          <div style="flex: 1 1 calc(50% - 10px); border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"><div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Teacher</div><div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">${formData.teacher}</div></div>
          <div style="flex: 1 1 calc(50% - 10px); border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"><div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Sex</div><div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">${formData.sex || '—'}</div></div>
          <div style="flex: 1 1 calc(50% - 10px); border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"><div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">School</div><div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">${formData.school}</div></div>
          <div style="flex: 1 1 calc(50% - 10px); border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"><div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Class</div><div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">${formData.cls}</div></div>
          <div style="flex: 1 1 calc(50% - 10px); border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"><div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Subject</div><div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">${formData.subject}</div></div>
          <div style="flex: 1 1 calc(50% - 10px); border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"><div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Roll</div><div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">${formData.roll}</div></div>
          <div style="flex: 1 1 calc(50% - 10px); border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"><div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Monitor</div><div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">${formData.monitorName}</div></div>
          <div style="flex: 1 1 calc(50% - 10px); border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"><div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Date</div><div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">${formData.date}</div></div>
        </div>
        <div style="display: flex; gap: 10px; margin-bottom: 24px; box-sizing: border-box;">
          <div style="flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 14px 10px; text-align: center; box-sizing: border-box;"><div style="font-size: 22px; font-weight: 700; color: #0F6E56;">${score(formData.A)}/15</div><div style="font-size: 10px; color: #666; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.05em;">A. Planning</div></div>
          <div style="flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 14px 10px; text-align: center; box-sizing: border-box;"><div style="font-size: 22px; font-weight: 700; color: #0F6E56;">${score(formData.B)}/55</div><div style="font-size: 10px; color: #666; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.05em;">B. Instructional</div></div>
          <div style="flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 14px 10px; text-align: center; box-sizing: border-box;"><div style="font-size: 22px; font-weight: 700; color: #0F6E56;">${score(formData.C)}/20</div><div style="font-size: 10px; color: #666; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.05em;">C. Class Mgmt</div></div>
          <div style="flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 14px 10px; text-align: center; box-sizing: border-box;"><div style="font-size: 22px; font-weight: 700; color: #0F6E56;">${score(formData.D)}/10</div><div style="font-size: 10px; color: #666; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.05em;">D. Assessment</div></div>
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #0F6E56; text-transform: uppercase; letter-spacing: 0.06em; border-left: 3px solid #0F6E56; padding-left: 8px; margin: 20px 0 8px; box-sizing: border-box;">Observer's Comments</div>
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 14px; min-height: 70px; font-size: 13px; color: #333; line-height: 1.6; margin-bottom: 12px; box-sizing: border-box;">${formData.comments || 'No comments recorded.'}</div>
        <div style="font-size: 12px; font-weight: 700; color: #0F6E56; text-transform: uppercase; letter-spacing: 0.06em; border-left: 3px solid #0F6E56; padding-left: 8px; margin: 20px 0 8px; box-sizing: border-box;">Areas for Improvement</div>
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 14px; min-height: 70px; font-size: 13px; color: #333; line-height: 1.6; margin-bottom: 12px; box-sizing: border-box;">${formData.areas || 'None specified.'}</div>
        <div style="margin-top: 32px; padding-top: 12px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; box-sizing: border-box;">
          <span>GES Tema Metropolis &mdash; Lesson Observation Form</span>
          <span>Monitor: ${formData.monitorName}</span>
          <span>Confidential &mdash; Official Use Only</span>
        </div>
      </div>
    `;

    const opt = {
      margin: 0.3,
      filename: `Observation_${formData.teacher.replace(/\s+/g, '_')}_${formData.date}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    const pdfBlob = await html2pdf().from(tempDiv).set(opt).output('blob');
    const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Observation Report',
        text: `Observation Report for ${formData.teacher}`,
        files: [file],
      });
    } else {
      // Fallback: trigger download
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = opt.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('An error occurred while generating or sharing the PDF.');
  }
};

export const generateAndShareObservationPDF = async (o) => {
  try {
    const bg = o.total_score >= 80 ? '#F3FAED' : o.total_score >= 65 ? '#E8F6F1' : o.total_score >= 50 ? '#FFF8EE' : '#FCEBEB';
    const c = o.total_score >= 80 ? '#43801D' : o.total_score >= 65 ? '#0F6E56' : o.total_score >= 50 ? '#A66B0D' : '#A32D2D';

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 32px 40px; font-size: 13px; max-width: 860px; margin: 0 auto; box-sizing: border-box;">
        <div style="border-bottom: 2.5px solid #0F6E56; padding-bottom: 14px; margin-bottom: 24px; box-sizing: border-box;">
          <h1 style="font-size: 20px; color: #0F6E56; font-weight: 700; margin-bottom: 4px; margin-top: 0;">Lesson Observation Report</h1>
          <p style="font-size: 12px; color: #555; margin-top: 2px;">Ghana Education Service &mdash; Tema Metropolis</p>
          <p style="font-size: 12px; color: #555;">Date of Visit: ${o.date} &bull; Time: ${o.start || ''} &ndash; ${o.end || ''}</p>
        </div>
        <div style="text-align: center; padding: 28px 16px; border-radius: 12px; margin-bottom: 24px; background: ${bg}; box-sizing: border-box;">
          <span style="font-size: 52px; font-weight: 700; color: ${c}; line-height: 1;">${o.total_score}</span><span style="font-size: 22px; color: ${c}; font-weight: 400;">/100</span>
          <div style="font-size: 18px; color: ${c}; font-weight: 600; margin-top: 8px;">${o.grade}</div>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; box-sizing: border-box;">
          <div style="flex: 1 1 calc(50% - 10px); border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"><div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Teacher</div><div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">${o.teacher}</div></div>
          <div style="flex: 1 1 calc(50% - 10px); border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"><div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Sex</div><div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">${o.sex || '—'}</div></div>
          <div style="flex: 1 1 calc(50% - 10px); border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"><div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">School</div><div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">${o.school}</div></div>
          <div style="flex: 1 1 calc(50% - 10px); border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"><div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Class</div><div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">${o.cls}</div></div>
          <div style="flex: 1 1 calc(50% - 10px); border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"><div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Subject</div><div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">${o.subject}</div></div>
          <div style="flex: 1 1 calc(50% - 10px); border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"><div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Roll</div><div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">${o.roll}</div></div>
          <div style="flex: 1 1 calc(50% - 10px); border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"><div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Monitor</div><div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">${o.monitorName}</div></div>
          <div style="flex: 1 1 calc(50% - 10px); border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"><div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Date</div><div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">${o.date}</div></div>
        </div>
        <div style="display: flex; gap: 10px; margin-bottom: 24px; box-sizing: border-box;">
          <div style="flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 14px 10px; text-align: center; box-sizing: border-box;"><div style="font-size: 22px; font-weight: 700; color: #0F6E56;">${o.score_a}/15</div><div style="font-size: 10px; color: #666; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.05em;">A. Planning</div></div>
          <div style="flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 14px 10px; text-align: center; box-sizing: border-box;"><div style="font-size: 22px; font-weight: 700; color: #0F6E56;">${o.score_b}/55</div><div style="font-size: 10px; color: #666; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.05em;">B. Instructional</div></div>
          <div style="flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 14px 10px; text-align: center; box-sizing: border-box;"><div style="font-size: 22px; font-weight: 700; color: #0F6E56;">${o.score_c}/20</div><div style="font-size: 10px; color: #666; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.05em;">C. Class Mgmt</div></div>
          <div style="flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 14px 10px; text-align: center; box-sizing: border-box;"><div style="font-size: 22px; font-weight: 700; color: #0F6E56;">${o.score_d}/10</div><div style="font-size: 10px; color: #666; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.05em;">D. Assessment</div></div>
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #0F6E56; text-transform: uppercase; letter-spacing: 0.06em; border-left: 3px solid #0F6E56; padding-left: 8px; margin: 20px 0 8px; box-sizing: border-box;">Observer's Comments</div>
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 14px; min-height: 70px; font-size: 13px; color: #333; line-height: 1.6; margin-bottom: 12px; box-sizing: border-box;">${o.comments || 'No comments recorded.'}</div>
        <div style="font-size: 12px; font-weight: 700; color: #0F6E56; text-transform: uppercase; letter-spacing: 0.06em; border-left: 3px solid #0F6E56; padding-left: 8px; margin: 20px 0 8px; box-sizing: border-box;">Areas for Improvement</div>
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 14px; min-height: 70px; font-size: 13px; color: #333; line-height: 1.6; margin-bottom: 12px; box-sizing: border-box;">${o.areas || 'None specified.'}</div>
        <div style="margin-top: 32px; padding-top: 12px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; box-sizing: border-box;">
          <span>GES Tema Metropolis &mdash; Lesson Observation Form</span>
          <span>Monitor: ${o.monitorName}</span>
          <span>Confidential &mdash; Official Use Only</span>
        </div>
      </div>
    `;

    const opt = {
      margin: 0.3,
      filename: `Observation_${o.teacher.replace(/\s+/g, '_')}_${o.date}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    const pdfBlob = await html2pdf().from(tempDiv).set(opt).output('blob');
    const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Observation Report',
        text: `Observation Report for ${o.teacher}`,
        files: [file],
      });
    } else {
      // Fallback: trigger download
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = opt.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('An error occurred while generating or sharing the PDF.');
  }
};
