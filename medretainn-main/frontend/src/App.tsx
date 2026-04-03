import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoadingSplash from './components/LoadingSplash';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationSystem from './components/NotificationSystem';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Batches from './pages/Batches';
import Messages from './pages/Messages';
import Analytics from './pages/Analytics';
import ConnectHIMS from './pages/ConnectHIMS';
import { checkHIMSConnection } from './api';
import { ThemeProvider } from './components/ThemeProvider';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const initApp = async () => {
    setIsLoading(true);
    try {
      const status = await checkHIMSConnection();
      setIsConnected(status.connected);
    } catch (err) {
      console.error('Failed to check HIMS connection:', err);
      // If backend is down or 404, we assume not connected to show onboarding
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  if (isLoading) {
    return <LoadingSplash isVisible={true} />;
  }

  // FORCE ONBOARDING IF NOT CONNECTED
  if (isConnected === false) {
    return (
      <ThemeProvider>
        <ConnectHIMS onConnected={() => setIsConnected(true)} />
        <NotificationSystem position="top-right" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/batches" element={<Batches />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ErrorBoundary>
        </Layout>
      </Router>
      <NotificationSystem position="top-right" />
    </ThemeProvider>
  );
};

export default App;
