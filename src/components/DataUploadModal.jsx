import { useState, useRef, useCallback } from 'react';
import { C, mono, sans } from '../constants/palette.js';
import { parseL2OData } from '../utils/l2oAdapter.js';

const ACCENT = '#009ADA';

const LS_KEY = 'l2o_uploaded_rows';

/* ── helpers ── */
export function loadSavedRows() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearSavedRows() {
  localStorage.removeItem(LS_KEY);
}

export function saveParsedRows(rows) {
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
}

/* ── modal ── */
export default function DataUploadModal({ onLoad, onClose, currentFileName }) {
  const [dragging, setDragging]   = useState(false);
  const [preview, setPreview]     = useState(null);   // { rows, sessions, agents, fileName }
  const [error, setError]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const inputRef = useRef();

  const parseFile = useCallback((file) => {
    setError(null);
    setPreview(null);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        // Accept: { rows: [...] }  OR  [ ... ] (raw array)
        const rows = Array.isArray(json) ? json : json.rows;
        if (!rows || !Array.isArray(rows)) throw new Error('No "rows" array found in file.');
        if (rows.length === 0) throw new Error('File contains no rows.');

        const parsed = parseL2OData(rows);

        // Build preview summary
        const sessions = parsed.sessions?.length ?? 0;
        const agents   = parsed.agents?.map(a => a.name).join(', ') ?? '—';
        const spans    = parsed.spans?.length ?? 0;
        const guardrails = parsed.guardrails?.length ?? 0;

        setPreview({ rows, sessions, agents, spans, guardrails, fileName: file.name, parsed });
      } catch (err) {
        setError(err.message || 'Failed to parse file.');
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Could not read file.');
      setLoading(false);
    };
    reader.readAsText(file);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) parseFile(file);
  };

  const handleLoad = () => {
    if (!preview) return;
    saveParsedRows(preview.rows);
    onLoad(preview.parsed);
    onClose();
  };

  const handleClearData = () => {
    clearSavedRows();
    onLoad(null);   // null = revert to bundled sample
    onClose();
  };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(0,0,0,.55)', backdropFilter:'blur(4px)',
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background:C.bg, border:`1px solid ${C.b2}`, borderRadius:10,
        width:'min(540px,95vw)', padding:28, display:'flex', flexDirection:'column', gap:20,
      }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontFamily:mono, fontSize:16, fontWeight:600, color:C.tx }}>Upload Observability Data</div>
            <div style={{ fontFamily:sans, fontSize:12, color:C.mu, marginTop:4 }}>
              Load a JSON file exported from Salesforce Data Cloud. All dashboard pages will update instantly.
            </div>
          </div>
          <button onClick={onClose} style={{ fontFamily:mono, fontSize:16, background:'transparent', border:'none', color:C.mu, cursor:'pointer', padding:'0 4px', lineHeight:1 }}>✕</button>
        </div>

        {/* Current data indicator */}
        {currentFileName && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:6, background:'rgba(0,154,218,.08)', border:`1px solid rgba(0,154,218,.25)` }}>
            <span style={{ fontFamily:mono, fontSize:11, color:ACCENT }}>⬆ Current: {currentFileName}</span>
            <button
              onClick={handleClearData}
              style={{ marginLeft:'auto', fontFamily:mono, fontSize:10, padding:'3px 10px', borderRadius:3, border:`1px solid ${C.reBd||'#f87171'}`, background:'transparent', color:C.re, cursor:'pointer' }}
            >
              ✕ Revert to sample data
            </button>
          </div>
        )}

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          style={{
            border:`2px dashed ${dragging ? ACCENT : C.b2}`,
            borderRadius:8, padding:'28px 20px', textAlign:'center', cursor:'pointer',
            background: dragging ? 'rgba(0,154,218,.06)' : 'transparent',
            transition:'all .2s',
          }}
        >
          <input ref={inputRef} type="file" accept=".json,application/json" style={{ display:'none' }} onChange={onFileChange} />
          {loading ? (
            <div style={{ fontFamily:mono, fontSize:13, color:ACCENT }}>⟳ Parsing…</div>
          ) : preview ? (
            <div style={{ fontFamily:mono, fontSize:12, color:C.gr }}>✓ {preview.fileName}</div>
          ) : (
            <>
              <div style={{ fontSize:28, marginBottom:8 }}>⬆</div>
              <div style={{ fontFamily:sans, fontSize:13, color:C.tx, marginBottom:4 }}>Drop your JSON file here</div>
              <div style={{ fontFamily:mono, fontSize:11, color:C.mu }}>or click to browse · .json only</div>
            </>
          )}
        </div>

        {/* Preview summary */}
        {preview && (
          <div style={{ background:C.sf, border:`1px solid ${C.b2}`, borderRadius:8, padding:'14px 16px' }}>
            <div style={{ fontFamily:mono, fontSize:11, color:C.dm, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>File Preview</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { label:'Sessions',   value: preview.sessions  },
                { label:'Spans',      value: preview.spans     },
                { label:'Guardrails', value: preview.guardrails },
                { label:'Agents',     value: preview.agents    },
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', fontFamily:mono, fontSize:12, padding:'6px 10px', background:C.bg, borderRadius:5 }}>
                  <span style={{ color:C.mu }}>{r.label}</span>
                  <span style={{ color:ACCENT, fontWeight:600 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ fontFamily:mono, fontSize:12, color:C.re, padding:'10px 14px', background:C.reBg||'rgba(248,113,113,.1)', borderRadius:6, border:`1px solid ${C.reBd||'rgba(248,113,113,.3)'}` }}>
            ✕ {error}
          </div>
        )}

        {/* JSON format help */}
        {!preview && !error && (
          <div style={{ fontFamily:mono, fontSize:10, color:C.dm, lineHeight:1.8 }}>
            Expected format:{'  '}<span style={{ color:ACCENT }}>{'{ "rows": [ { "span_id__c": "...", ... } ] }'}</span><br />
            Or a raw array: <span style={{ color:ACCENT }}>{'[ { "span_id__c": "...", ... } ]'}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ fontFamily:mono, fontSize:12, padding:'8px 18px', borderRadius:4, border:`1px solid ${C.b2}`, background:'transparent', color:C.mu, cursor:'pointer' }}>Cancel</button>
          <button
            onClick={handleLoad}
            disabled={!preview}
            style={{
              fontFamily:mono, fontSize:12, padding:'8px 22px', borderRadius:4, border:'none',
              background: preview ? ACCENT : C.b2, color: preview ? '#fff' : C.dm,
              cursor: preview ? 'pointer' : 'not-allowed', fontWeight:600, transition:'all .2s',
            }}
          >
            ⬆ Load Data
          </button>
        </div>
      </div>
    </div>
  );
}
