import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SchematicEditorLayout from './pages/SchematicEditorLayout';
import { SVEStudio } from './pages/SVEStudio';
import ToastContainer from './components/ToastContainer';
import { CircuitProvider } from './contexts/CircuitContext';
import { healthCheck } from './utils/apiClient';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Error Boundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', fontFamily: 'monospace' }}>
          <h1>App crashed</h1>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  // Initialize theme on app load
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = savedTheme || (prefersDark ? 'dark' : 'light');

      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      console.log('Theme initialized:', theme);
    } catch (error) {
      console.error('Theme initialization error:', error);
    }
  }, []);

  // Check backend services health on startup
  useEffect(() => {
    console.log('Starting health check...');
    healthCheck().then((status) => {
      console.log('Backend services status:', status);
      // You can add logging or UI feedback here if services are down
    }).catch((error) => {
      console.error('Health check error:', error);
    });
  }, []);

  return (
    <ErrorBoundary>
      <CircuitProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/editor" element={<SchematicEditorLayout />} />
            <Route path="/editor/:roomId" element={<SchematicEditorLayout />} />
            <Route path="/room/:roomId" element={<SchematicEditorLayout />} />
            <Route path="/admin/sve" element={<SVEStudio />} />
          </Routes>
          <ToastContainer />
        </Router>
      </CircuitProvider>
    </ErrorBoundary>
  );
}

export default App;
