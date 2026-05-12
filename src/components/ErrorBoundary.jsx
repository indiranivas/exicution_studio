import { Component } from 'react';
import { C, mono, sans } from '../constants/palette.js';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 300, gap: 16, padding: 40,
          background: C.sf, border: `1px solid ${C.reBd}`, borderRadius: 6,
          borderLeft: `4px solid ${C.re}`,
        }}>
          <div style={{ fontFamily: mono, fontSize: 11, color: C.re, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            ⚠ Page Error
          </div>
          <div style={{ fontFamily: sans, fontSize: 14, color: C.tx, textAlign: 'center', maxWidth: 420, lineHeight: 1.6 }}>
            This page encountered an unexpected error. Your data is safe — navigate to another section or reset this view.
          </div>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.dm, maxWidth: 500, textAlign: 'center', lineHeight: 1.5 }}>
            {this.state.error?.message}
          </div>
          <button
            onClick={() => this.reset()}
            style={{
              fontFamily: mono, fontSize: 11, padding: '7px 20px', borderRadius: 3,
              border: `1px solid ${C.reBd}`, background: C.reBg, color: C.re, cursor: 'pointer',
            }}
          >
            ↺ Reset View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
