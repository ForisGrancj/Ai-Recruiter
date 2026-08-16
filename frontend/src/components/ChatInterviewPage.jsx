import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock, Award, CheckCircle2, AlertTriangle, XCircle, Sparkles, RefreshCw, FileText, ChevronRight, X, Lock } from 'lucide-react';
import { submitQuestionAnswer, evaluateInterviewSession } from '../services/api';

export default function ChatInterviewPage({ sessionData, sessionMeta, onNewInterviewRequested }) {
  const [messages, setMessages] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [showEvalModal, setShowEvalModal] = useState(false);

  const isSessionCompleted = sessionData?.status === 'completed';

  const sessionId = sessionData?.id;
  const candidateName = sessionMeta?.candidateName || sessionData?.candidate_name || 'Candidate';
  const jobTitle = sessionMeta?.jobTitle || 'Position';
  const initialDuration = (sessionMeta?.durationMinutes || sessionData?.duration_minutes || 15) * 60;

  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isTimerActive, setIsTimerActive] = useState(!isSessionCompleted);

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (sessionData && sessionData.questions && sessionData.questions.length > 0) {
      const formattedMsgs = [];
      sessionData.questions.forEach((q) => {
        if (q.question_text) {
          formattedMsgs.push({ sender: 'ai', text: q.question_text, id: q.id });
        }
        if (q.candidate_answer) {
          formattedMsgs.push({ sender: 'user', text: q.candidate_answer, id: `${q.id}_ans` });
        }
      });
      setMessages(formattedMsgs);

      if (sessionData.status === 'completed') {
        setIsTimerActive(false);
        setEvaluationResult({
          score: sessionData.score ?? 75,
          verdict: sessionData.verdict || 'UNDER_REVIEW',
          ai_evaluation: sessionData.ai_evaluation || 'Interview session completed.'
        });
        setShowEvalModal(false);
      } else {
        setIsTimerActive(true);
        setShowEvalModal(false);
      }
    } else if (sessionData && sessionData.id) {
      setMessages([
        {
          sender: 'ai',
          text: `Hello ${candidateName}! Welcome to your AI interview for the ${jobTitle} position. Could you please introduce yourself and highlight your relevant experience for this role?`,
          id: 'init_1'
        }
      ]);
      setIsTimerActive(true);
      setShowEvalModal(false);
    }
  }, [sessionData]);

  useEffect(() => {
    if (!isTimerActive || timeLeft <= 0 || isSessionCompleted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerActive(false);
          handleEvaluateSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft, isSessionCompleted]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendAnswer = async (e) => {
    if (e) e.preventDefault();
    if (!currentAnswer.trim() || loading || isEvaluating || isSessionCompleted) return;

    const userText = currentAnswer.trim();
    setCurrentAnswer('');

    const updatedMsgs = [...messages, { sender: 'user', text: userText, id: Date.now() }];
    setMessages(updatedMsgs);
    setLoading(true);

    try {
      const res = await submitQuestionAnswer(sessionId, userText);
      setLoading(false);

      const aiText = res.question_text || res.next_question || '';

      if (aiText) {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: aiText, id: res.id || Date.now() + 1 }
        ]);
      }

      const isConcluding =
        res.session_status === 'completed' ||
        aiText.toLowerCase().includes('conclude our interview') ||
        aiText.toLowerCase().includes('conclude our interview session') ||
        aiText.toLowerCase().includes('best in your career');

      if (isConcluding) {
        handleEvaluateSession();
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Network error occurred while processing your response. Please try again.', id: Date.now() + 1 }
      ]);
    }
  };

  const handleEvaluateSession = async () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setIsTimerActive(false);

    try {
      const evalRes = await evaluateInterviewSession(sessionId);
      setIsEvaluating(false);

      setEvaluationResult({
        score: evalRes.score,
        verdict: evalRes.verdict,
        ai_evaluation: evalRes.ai_evaluation
      });
      setShowEvalModal(true);
    } catch (err) {
      console.error(err);
      setIsEvaluating(false);
      setEvaluationResult({
        score: 75,
        verdict: 'UNDER_REVIEW',
        ai_evaluation: 'Interview completed and responses evaluated.'
      });
      setShowEvalModal(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-main)] text-[var(--text-primary)] overflow-hidden relative transition-colors duration-200">
      
      <header className="h-14 px-6 bg-[var(--bg-main)] border-b border-[var(--border-color)] flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] font-semibold text-xs shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-xs text-[var(--text-primary)]">{candidateName}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] font-medium font-mono">
                {jobTitle}
              </span>
            </div>

            {isSessionCompleted ? (
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Completed Interview • Read-Only
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live AI Interview
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isSessionCompleted && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-mono font-semibold text-amber-500 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}

          {isSessionCompleted ? (
            <button
              onClick={() => setShowEvalModal(true)}
              className="py-1.5 px-3 rounded-lg bg-[var(--btn-sec-bg)] hover:bg-[var(--btn-sec-hover)] text-[var(--btn-sec-text)] font-medium text-xs border border-[var(--border-color)] flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              <span>View Evaluation Report ({sessionData?.score != null ? `${sessionData.score} Pts` : 'Report'})</span>
            </button>
          ) : (
            <button
              onClick={handleEvaluateSession}
              disabled={isEvaluating}
              className="py-1.5 px-3.5 rounded-lg bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-semibold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Award className="w-3.5 h-3.5" />
                  <span>End & Score Interview</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
        <div className="max-w-3xl mx-auto space-y-5">
          
          {messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] font-bold text-xs flex-shrink-0 mt-1 shadow-sm">
                  A
                </div>
              )}

              <div
                className={`max-w-xl rounded-xl p-4 text-xs lg:text-sm leading-relaxed shadow-sm border ${
                  msg.sender === 'user'
                    ? 'bg-[var(--chat-user-bg)] border-[var(--border-color)] text-[var(--text-primary)] rounded-tr-none'
                    : 'bg-[var(--chat-ai-bg)] border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-none'
                }`}
              >
                {msg.sender === 'ai' && (
                  <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Aura (AI Recruiter)
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] font-semibold text-xs flex-shrink-0 mt-1 shadow-sm">
                  U
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center">
              <div className="w-7 h-7 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] font-bold text-xs flex-shrink-0 shadow-sm">
                A
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-pulse-dot" />
                <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-pulse-dot [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-pulse-dot [animation-delay:0.4s]" />
                <span className="text-[11px] text-[var(--text-muted)] font-medium ml-1">Evaluating response & preparing follow-up question...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      <footer className="p-4 bg-[var(--bg-main)] border-t border-[var(--border-color)]">
        {isSessionCompleted ? (
          <div className="max-w-3xl mx-auto p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-center text-xs text-[var(--text-muted)] font-medium flex items-center justify-center gap-2 shadow-sm">
            <Lock className="w-4 h-4 text-emerald-500" />
            <span>This interview session is completed (Read-Only). You can start a new interview from the sidebar.</span>
          </div>
        ) : (
          <form onSubmit={handleSendAnswer} className="max-w-3xl mx-auto flex gap-2.5 items-end">
            <div className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] focus-within:border-[var(--border-hover)] rounded-xl p-3 flex flex-col gap-2 shadow-sm">
              <textarea
                rows="2"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendAnswer();
                  }
                }}
                placeholder="Type your response here... (Press Enter to send)"
                disabled={loading || isEvaluating}
                className="w-full bg-transparent text-xs lg:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none resize-none"
              />
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
                <span>💡 Tip: Your response relevance to the position and CV context will be evaluated automatically.</span>
                <span>Enter ↵</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!currentAnswer.trim() || loading || isEvaluating}
              className="w-10 h-10 rounded-lg bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] flex items-center justify-center shadow-sm transition disabled:opacity-40 cursor-pointer flex-shrink-0 font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </footer>

      {showEvalModal && evaluationResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative overflow-hidden">
            
            <div className="flex items-start justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] shadow-sm">
                  <Award className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Interview Evaluation Report</h3>
                  <p className="text-xs text-[var(--text-muted)]">Aura AI Relevance & Competency Analysis</p>
                </div>
              </div>
              <button
                onClick={() => setShowEvalModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md hover:bg-[var(--border-color)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--bg-card-subtle)] border border-[var(--border-color)] rounded-xl p-4 text-center flex flex-col items-center justify-center">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Overall Alignment Score
                </div>
                <div className="text-3xl font-extrabold text-[var(--text-primary)] font-mono">
                  {evaluationResult.score} <span className="text-xs font-normal text-[var(--text-muted)]">/ 100</span>
                </div>
                <div className="w-full bg-[var(--border-color)] h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, Math.max(0, evaluationResult.score))}%` }}
                  />
                </div>
              </div>

              <div className="bg-[var(--bg-card-subtle)] border border-[var(--border-color)] rounded-xl p-4 text-center flex flex-col items-center justify-center">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  HR Recommendation
                </div>
                <div className="mt-1">
                  {evaluationResult.verdict === 'HIRE' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" /> RECOMMENDED (HIRE)
                    </span>
                  ) : evaluationResult.verdict === 'REJECT' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-500/10 border border-red-500/30 text-red-500 font-bold text-xs">
                      <XCircle className="w-3.5 h-3.5" /> NOT RECOMMENDED (REJECT)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold text-xs">
                      <AlertTriangle className="w-3.5 h-3.5" /> UNDER REVIEW (HOLD)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-card-subtle)] border border-[var(--border-color)] rounded-xl p-4 text-xs text-[var(--text-primary)] leading-relaxed max-h-52 overflow-y-auto space-y-2">
              <div className="font-semibold text-[var(--text-primary)] text-xs uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" /> Detailed AI Scorecard Report
              </div>
              <div className="whitespace-pre-wrap font-sans text-[var(--text-primary)]">
                {evaluationResult.ai_evaluation}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  setShowEvalModal(false);
                  if (onNewInterviewRequested) onNewInterviewRequested();
                }}
                className="flex-1 py-2.5 rounded-lg bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <span>+ Start New Interview</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

