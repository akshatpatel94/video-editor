import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  public handleReload = (): void => {
    window.location.reload()
  }

  public handleDismiss = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '30px',
          backgroundColor: '#1a1d2e',
          color: '#e2e8f0',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '12px' }}>⚠️ Something went wrong</h2>
          <p style={{ maxWidth: '600px', textAlign: 'center', color: '#94a3b8', marginBottom: '20px' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <pre style={{
            background: '#0f172a',
            padding: '16px',
            borderRadius: '8px',
            maxWidth: '800px',
            maxHeight: '300px',
            overflow: 'auto',
            fontSize: '12px',
            color: '#f87171',
            marginBottom: '20px'
          }}>
            {this.state.error?.stack}
          </pre>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              🔄 Reload App
            </button>
            <button
              onClick={this.handleDismiss}
              style={{
                padding: '10px 20px',
                backgroundColor: '#334155',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
