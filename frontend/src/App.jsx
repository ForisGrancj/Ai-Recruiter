import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import SetupPage from './components/SetupPage';
import ChatInterviewPage from './components/ChatInterviewPage';
import { getInterviews } from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState('setup');
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [activeMeta, setActiveMeta] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await getInterviews();
      if (data && Array.isArray(data)) {
        setSessions(data);
      }
    } catch (err) {
      console.error('Sessions fetch error:', err);
    }
  };

  const handleNewInterview = () => {
    setActiveSession(null);
    setActiveMeta(null);
    setActivePage('setup');
  };

  const handleInterviewStarted = (sessionData, metaData) => {
    setActiveSession(sessionData);
    setActiveMeta(metaData);
    setActivePage('chat');
    fetchSessions();
  };

  const handleSelectSession = (sess) => {
    setActiveSession(sess);
    setActiveMeta({
      candidateName: sess.candidate_name || `Candidate #${sess.candidate}`,
      jobTitle: sess.job_title || 'Interview Position',
      durationMinutes: sess.duration_minutes || 15
    });
    setActivePage('chat');
  };

  return (
    <div className="flex h-screen w-screen bg-[var(--bg-main)] text-[var(--text-primary)] overflow-hidden font-sans select-none transition-colors duration-200">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSession?.id}
        onSelectSession={handleSelectSession}
        onNewInterview={handleNewInterview}
        activePage={activePage}
        onNavigatePage={(page) => setActivePage(page)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 h-full flex flex-col overflow-hidden relative">
        {activePage === 'setup' ? (
          <SetupPage onInterviewStarted={handleInterviewStarted} />
        ) : (
          <ChatInterviewPage
            sessionData={activeSession}
            sessionMeta={activeMeta}
            onNewInterviewRequested={handleNewInterview}
          />
        )}
      </main>
    </div>
  );
}

