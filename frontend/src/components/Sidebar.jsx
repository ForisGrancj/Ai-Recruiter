import React from 'react';
import { Plus, MessageSquare, Clock, Bot, UserCheck, ChevronRight, Award, Sun, Moon } from 'lucide-react';

export default function Sidebar({
  sessions = [],
  activeSessionId,
  onSelectSession,
  onNewInterview,
  activePage,
  onNavigatePage,
  theme,
  onToggleTheme
}) {
  const isDark = theme === 'dark';

  return (
    <aside className="w-72 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col h-full select-none text-[var(--text-primary)] transition-colors duration-200">
      <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] shadow-sm">
            <Bot className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-[var(--text-primary)] flex items-center gap-1.5">
              Aura AI
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)]">RECRUITER</span>
            </h1>
            <p className="text-[11px] text-[var(--text-muted)] font-medium">Executive AI Recruiter</p>
          </div>
        </div>

        <button
          onClick={onToggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--border-color)] transition cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>
      </div>

      <div className="p-3">
        <button
          onClick={onNewInterview}
          className={`w-full py-2 px-3 rounded-lg font-medium text-xs flex items-center justify-between transition-all duration-150 shadow-sm cursor-pointer ${
            activePage === 'setup'
              ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:opacity-90 ring-1 ring-[var(--border-hover)]'
              : 'bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--border-color)] border border-[var(--border-color)]'
          }`}
        >
          <span className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" />
            Create New Interview
          </span>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </button>
      </div>

      <div className="px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between border-t border-[var(--border-color)] mt-1">
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          Interview History
        </span>
        <span className="text-[10px] bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] px-1.5 py-0.5 rounded font-mono">
          {sessions.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--text-muted)] italic rounded-lg border border-dashed border-[var(--border-color)] my-2">
            No interview sessions found.
          </div>
        ) : (
          sessions.map((sess) => {
            const isActive = activePage === 'chat' && activeSessionId === sess.id;
            const isCompleted = sess.status === 'completed';

            return (
              <button
                key={sess.id}
                onClick={() => {
                  onSelectSession(sess);
                  onNavigatePage('chat');
                }}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-all duration-150 group relative border cursor-pointer ${
                  isActive
                    ? 'bg-[var(--bg-card)] border-[var(--border-hover)] text-[var(--text-primary)] shadow-sm font-semibold'
                    : 'bg-transparent hover:bg-[var(--bg-card)] border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium truncate text-[var(--text-primary)] group-hover:text-[var(--text-primary)] flex-1">
                    {sess.candidate_name || `Candidate #${sess.candidate}`}
                  </div>
                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      <Award className="w-3 h-3 text-emerald-500" />
                      {sess.score != null ? `${sess.score} Pts` : 'Completed'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      <Clock className="w-3 h-3 animate-spin" />
                      In Progress
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] truncate mt-1 font-mono">
                  Session #{sess.id}
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] font-semibold text-xs">
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div>
            <div className="font-medium text-[var(--text-primary)] text-xs">Aura Recruiter</div>
            <div className="text-[10px] text-[var(--text-muted)]">Pro Plan • Active</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

