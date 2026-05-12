import { useState, useEffect, useRef } from 'react';
import { C, mono, sans } from '../constants/palette.js';
import { generateReport } from '../utils/generateReport.js';

const ACCENT = '#009ADA';

/** Lightweight markdown → HTML renderer (headings, bold, tables, bullets, code) */
function renderMarkdown(md) {
  if (!md) return '';
  let html = md
    // Headings
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr/>')
    // Tables — convert | … | rows
    .replace(/^\|(.+)\|$/gm, (_, row) => {
      const cells = row.split('|').map(c => c.trim());
      return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
    })
    .replace(/^<tr><td>[-: ]+<\/td>.*<\/tr>$/gm, '') // remove separator rows
    // Bullets
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    // Numbered list
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Paragraphs — double newlines
    .replace(/\n\n/g, '</p><p>')
    // Single newlines inside paragraphs
    .replace(/\n/g, '<br/>');

  // Wrap table rows in <table>
  html = html.replace(/(<tr>[\s\S]*?<\/tr>)+/g, m => `<table>${m}</table>`);
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`);

  return `<p>${html}</p>`;
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadAsPdf(htmlContent, title, isDark) {
  const date = new Date().toLocaleString();
  const win  = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'IBM Plex Sans', sans-serif; font-size: 12px; line-height: 1.7; color: #0f172a; background: #fff; padding: 48px; max-width: 900px; margin: 0 auto; }
  .cover { border-bottom: 3px solid #009ADA; padding-bottom: 24px; margin-bottom: 32px; }
  .cover-title { font-size: 26px; font-weight: 300; color: #0f172a; margin-bottom: 6px; }
  .cover-sub { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #64748b; }
  h1 { font-size: 20px; font-weight: 600; color: #0f172a; margin: 28px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #009ADA; }
  h2 { font-size: 16px; font-weight: 600; color: #009ADA; margin: 22px 0 8px; }
  h3 { font-size: 14px; font-weight: 600; color: #334155; margin: 16px 0 6px; }
  h4 { font-size: 12px; font-weight: 600; color: #64748b; margin: 12px 0 4px; }
  p  { margin: 6px 0 10px; }
  ul, ol { padding-left: 22px; margin: 6px 0 10px; }
  li { margin: 4px 0; }
  strong { font-weight: 600; color: #0f172a; }
  code { font-family: 'IBM Plex Mono', monospace; font-size: 10px; background: #f1f5f9; padding: 1px 5px; border-radius: 3px; }
  pre { font-family: 'IBM Plex Mono', monospace; font-size: 10px; background: #f1f5f9; padding: 14px 16px; border-radius: 6px; overflow-x: auto; margin: 10px 0; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 12px 0; font-family: 'IBM Plex Mono', monospace; page-break-inside: avoid; }
  td, th { padding: 7px 10px; border: 1px solid #e2e8f0; vertical-align: top; text-align: left; }
  tr:first-child td, th { background: #f8fafc; font-weight: 600; font-family: 'IBM Plex Sans', sans-serif; font-size: 11px; }
  tr:nth-child(even) td { background: #fafafa; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #94a3b8; }
  @media print {
    body { padding: 24px; font-size: 11px; }
    h1 { font-size: 18px; }
    h2 { font-size: 14px; }
    h3 { font-size: 13px; }
    table { font-size: 10px; }
    td, th { padding: 5px 8px; }
    @page { margin: 20mm; size: A4; }
  }
<\/style>
<\/head>
<body>
<div class="cover">
  <div class="cover-title">LevelShift AgentOps</div>
  <div class="cover-title" style="font-size:18px;margin-top:4px">${title}<\/div>
  <div class="cover-sub" style="margin-top:12px">Generated: ${date} &nbsp;·&nbsp; prod-us-east-1 &nbsp;·&nbsp; Azure OpenAI<\/div>
<\/div>
${htmlContent}
<div class="footer">LevelShift AgentOps &nbsp;·&nbsp; Confidential &nbsp;·&nbsp; Generated ${date}<\/div>
<\/body><\/html>`);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 800);
}

export default function ExportReportModal({ st, onClose, mode = 'business' }) {
  const [status,  setStatus]  = useState('idle'); // idle | loading | done | error
  const [report,  setReport]  = useState('');
  const [errMsg,  setErrMsg]  = useState('');
  const [copying, setCopying] = useState(false);
  const contentRef = useRef(null);

  // Auto-start generation when modal opens
  useEffect(() => {
    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    setStatus('loading');
    setReport('');
    setErrMsg('');
    try {
      const { markdown } = await generateReport(st, mode);
      setReport(markdown);
      setStatus('done');
    } catch (e) {
      setErrMsg(e.message || 'Unknown error');
      setStatus('error');
    }
  }

  function handleDownloadPdf() {
    const title = mode === 'technical' ? 'Technical Engineering Report' : 'AI Operations Report';
    downloadAsPdf(renderMarkdown(report), title, false);
  }

  function handleDownloadMd() {
    const date = new Date().toISOString().slice(0, 10);
    const prefix = mode === 'technical' ? 'technical-report' : 'levelshift-report';
    downloadFile(report, `${prefix}-${date}.md`, 'text/markdown');
  }

  function handleDownloadTxt() {
    const date = new Date().toISOString().slice(0, 10);
    const prefix = mode === 'technical' ? 'technical-report' : 'levelshift-report';
    // Strip markdown syntax for plain text
    const plain = report
      .replace(/#{1,6} /g, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^\|.+\|$/gm, l => l.replace(/\|/g, '  ').trim())
      .replace(/^[-*] /gm, '• ');
    downloadFile(plain, `${prefix}-${date}.txt`, 'text/plain');
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(report);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (_) {}
  }

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        background: C.sf, border: `1px solid ${C.b2}`,
        borderRadius: 8, width: '100%', maxWidth: 820,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,.5)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: `1px solid ${C.b2}`, flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 500 }}>{mode === 'technical' ? 'Technical Engineering Report' : 'AI Operations Report'}</div>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.mu, marginTop: 2 }}>
              {mode === 'technical' ? 'Engineering telemetry · MELT · spans · guardrails · ' : 'Generated · '}{new Date().toLocaleString()} · prod-us-east-1 · Azure OpenAI
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.mu, fontSize: 18, lineHeight: 1, padding: 4,
          }}>✕</button>
        </div>

        {/* Body */}
        <div ref={contentRef} style={{
          flex: 1, overflowY: 'auto', padding: '20px 24px',
          fontFamily: sans, fontSize: 13, lineHeight: 1.7, color: C.tx,
        }}>
          {status === 'loading' && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: C.mu }}>
              <div style={{ fontSize: 28, marginBottom: 16, animation: 'spin 1s linear infinite', display: 'inline-block' }}>◌</div>
              <div style={{ fontFamily: mono, fontSize: 12 }}>Analysing telemetry and generating detailed report…</div>
              <div style={{ fontFamily: mono, fontSize: 11, color: C.dm, marginTop: 6 }}>
                {mode === 'technical' ? '14 sections · spans · guardrails · MELT · root cause · action items' : '13 sections · metrics · ROI · risks · recommendations'}
              </div>
              <div style={{ fontFamily: mono, fontSize: 11, color: C.dm, marginTop: 4 }}>
                Calling Azure OpenAI · {import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div style={{ padding: '32px 0' }}>
              <div style={{ color: C.re, fontFamily: mono, fontSize: 13, marginBottom: 12 }}>⚠ Report generation failed</div>
              <div style={{ background: C.reBg || 'rgba(239,68,68,.08)', border: `1px solid ${C.re}44`, borderRadius: 6, padding: '12px 16px', fontFamily: mono, fontSize: 12, color: C.re, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {errMsg}
              </div>
              <button
                onClick={generate}
                style={{ marginTop: 16, fontFamily: mono, fontSize: 12, padding: '8px 18px', borderRadius: 4, border: `1px solid ${ACCENT}`, background: 'transparent', color: ACCENT, cursor: 'pointer' }}
              >
                ↺ Retry
              </button>
            </div>
          )}

          {status === 'done' && (
            <div
              style={{
                '--h1': '20px', '--h2': '17px', '--h3': '15px', '--h4': '13px',
              }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(report) }}
              className="report-body"
            />
          )}
        </div>

        {/* Footer actions */}
        {status === 'done' && (
          <div style={{
            display: 'flex', gap: 8, padding: '14px 20px',
            borderTop: `1px solid ${C.b2}`, flexShrink: 0, flexWrap: 'wrap',
          }}>
            <button onClick={handleDownloadPdf} style={{
              fontFamily: mono, fontSize: 11, padding: '7px 16px', borderRadius: 4,
              border: `1px solid #ef4444`, background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 500,
            }}>⬇ Download PDF</button>
            <button onClick={handleDownloadMd} style={{
              fontFamily: mono, fontSize: 11, padding: '7px 16px', borderRadius: 4,
              border: `1px solid ${ACCENT}`, background: ACCENT, color: '#fff', cursor: 'pointer', fontWeight: 500,
            }}>⬇ Download .md</button>
            <button onClick={handleDownloadTxt} style={{
              fontFamily: mono, fontSize: 11, padding: '7px 16px', borderRadius: 4,
              border: `1px solid ${C.b2}`, background: 'transparent', color: C.mu, cursor: 'pointer',
            }}>⬇ Download .txt</button>
            <button onClick={handleCopy} style={{
              fontFamily: mono, fontSize: 11, padding: '7px 16px', borderRadius: 4,
              border: `1px solid ${C.b2}`, background: 'transparent', color: copying ? C.gr : C.mu, cursor: 'pointer',
            }}>{copying ? '✓ Copied' : '⎘ Copy Markdown'}</button>
            <button onClick={generate} style={{
              fontFamily: mono, fontSize: 11, padding: '7px 14px', borderRadius: 4,
              border: `1px solid ${C.b2}`, background: 'transparent', color: C.mu, cursor: 'pointer', marginLeft: 'auto',
            }}>↺ Regenerate</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .report-body h1 { font-size: 20px; font-weight: 600; margin: 24px 0 10px; border-bottom: 1px solid ${C.b2}; padding-bottom: 6px; }
        .report-body h2 { font-size: 16px; font-weight: 600; margin: 20px 0 8px; color: ${ACCENT}; }
        .report-body h3 { font-size: 14px; font-weight: 600; margin: 16px 0 6px; }
        .report-body h4 { font-size: 13px; font-weight: 600; margin: 12px 0 4px; color: ${C.mu}; }
        .report-body p  { margin: 6px 0; }
        .report-body ul { padding-left: 20px; margin: 6px 0; }
        .report-body li { margin: 3px 0; }
        .report-body strong { color: ${C.tx}; font-weight: 600; }
        .report-body code { font-family: ${mono}; font-size: 11px; background: rgba(0,0,0,.12); padding: 1px 5px; border-radius: 3px; }
        .report-body hr { border: none; border-top: 1px solid ${C.b2}; margin: 16px 0; }
        .report-body table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 10px 0; font-family: ${mono}; }
        .report-body td { padding: 6px 10px; border: 1px solid ${C.b2}; vertical-align: top; }
        .report-body tr:first-child td { background: rgba(0,0,0,.06); font-weight: 600; }
        .report-body tr:nth-child(even) td { background: rgba(0,0,0,.025); }
      `}</style>
    </div>
  );
}
