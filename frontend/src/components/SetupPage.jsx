import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, Sparkles, User, Briefcase, Plus, X, ArrowRight, Key, Eye, EyeOff, Lock } from 'lucide-react';
import { uploadCandidateCV, createJob, startInterviewSession } from '../services/api';

const COUNTRY_CODES = [
  { code: '+90', label: '🇹🇷 +90', placeholder: '(5XX) XXX-XXXX' },
  { code: '+1', label: '🇺🇸 +1', placeholder: '(555) 000-0000' },
  { code: '+44', label: '🇬🇧 +44', placeholder: '7123 456789' },
  { code: '+49', label: '🇩🇪 +49', placeholder: '151 12345678' },
  { code: '+33', label: '🇫🇷 +33', placeholder: '6 12 34 56 78' },
  { code: '+31', label: '🇳🇱 +31', placeholder: '6 12345678' },
  { code: '+971', label: '🇦🇪 +971', placeholder: '50 123 4567' },
  { code: '+966', label: '🇸🇦 +966', placeholder: '50 123 4567' },
  { code: '+994', label: '🇦🇿 +994', placeholder: '50 123 45 67' }
];


export default function SetupPage({ onInterviewStarted }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+90');
  const [phone, setPhone] = useState('');
  const [cvFile, setCvFile] = useState(null);

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showApiKey, setShowApiKey] = useState(false);

  const [skills, setSkills] = useState(['Python', 'React', 'AI / LLM']);
  const [skillInput, setSkillInput] = useState('');

  const [jobTitle, setJobTitle] = useState('Senior Software Engineer');
  const [department, setDepartment] = useState('Software & Technology');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [jobDescription, setJobDescription] = useState(
    'We are looking for an analytical team member experienced in AI systems, Python, React, and RAG architectures.'
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const formatPhoneNumber = (value, code) => {
    const digits = value.replace(/\D/g, '');
    if (code === '+90' || code === '+1') {
      if (digits.length <= 3) return digits ? `(${digits}` : '';
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value, countryCode);
    setPhone(formatted);
  };

  const validateEmailFormat = (emailStr) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(emailStr.trim());
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!apiKey.trim()) {
      setErrorMsg('Please enter your Gemini API Key to launch the interview.');
      return;
    }
    if (!firstName || !lastName || !email) {
      setErrorMsg('Please fill in the first name, last name, and email fields.');
      return;
    }

    if (!validateEmailFormat(email)) {
      setErrorMsg('Please enter a valid email address with a domain extension (e.g. john@gmail.com, name@company.org).');
      return;
    }

    const cleanPhoneDigits = phone.replace(/\D/g, '');
    if (phone.trim() && cleanPhoneDigits.length < 7) {
      setErrorMsg('Please enter a valid phone number with at least 7 digits.');
      return;
    }

    if (!jobTitle) {
      setErrorMsg('Please specify the target position title.');
      return;
    }

    setLoading(true);

    try {
      localStorage.setItem('gemini_api_key', apiKey.trim());

      const fullPhoneNumber = phone.trim() ? `${countryCode} ${phone.trim()}` : '';

      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('email', email.trim());
      formData.append('phone', fullPhoneNumber);
      formData.append('desired_roles', `${jobTitle} (${skills.join(', ')})`);
      if (cvFile) {
        formData.append('cv_file', cvFile);
      }

      const candidateRes = await uploadCandidateCV(formData);
      const candidateId = candidateRes.candidate?.id || candidateRes.id;

      const jobData = {
        title: jobTitle,
        description: `${department} - ${jobDescription}. Required Competencies: ${skills.join(', ')}`,
        duration_minutes: Number(durationMinutes) || 15
      };
      const jobRes = await createJob(jobData);
      const jobPostingId = jobRes.id;

      const sessionRes = await startInterviewSession(candidateId, jobPostingId);

      setLoading(false);
      if (onInterviewStarted) {
        onInterviewStarted(sessionRes, {
          candidateName: `${firstName} ${lastName}`,
          jobTitle,
          department,
          durationMinutes
        });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while starting the interview session.');
      setLoading(false);
    }
  };


  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg-main)] p-6 lg:p-10 text-[var(--text-primary)] flex flex-col justify-between transition-colors duration-200">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] text-xs font-medium shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Step 1: Setup & Configuration
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Demo Interview & CV Setup
          </h2>
          <p className="text-[var(--text-secondary)] text-sm max-w-2xl">
            Upload your CV below, enter your API key, define your key skills, and select your target position to launch your live AI interview.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* API Key Configuration Card */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-color)] flex items-center justify-center text-amber-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    Gemini API Key
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono border border-emerald-500/20">Client-Side Persistence</span>
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">Your API key is sent via secure headers and never stored in server databases.</p>
                </div>
              </div>
              <Lock className="w-4 h-4 text-[var(--text-muted)]" />
            </div>

            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                required
                placeholder="Enter your Google Gemini API Key (AIzaSy...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg pl-3.5 pr-10 py-2.5 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-hover)]"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
                title={showApiKey ? "Hide Key" : "Show Key"}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--border-color)]">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)]">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">Candidate Information & CV Upload</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Provide your personal details and upload your resume</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3.5 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-hover)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3.5 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-hover)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <div className="min-w-0">
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3.5 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-hover)]"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Phone Number
                </label>
                <div className="flex gap-1.5 min-w-0">
                  <select
                    value={countryCode}
                    onChange={(e) => {
                      setCountryCode(e.target.value);
                      setPhone(formatPhoneNumber(phone, e.target.value));
                    }}
                    className="w-[92px] shrink-0 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-2 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)] font-mono cursor-pointer"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder={COUNTRY_CODES.find((c) => c.code === countryCode)?.placeholder || 'Phone number'}
                    value={phone}
                    onChange={handlePhoneChange}
                    className="flex-1 min-w-0 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3.5 py-2 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-hover)]"
                  />
                </div>
              </div>
            </div>



            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Skills & Expertise
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. Docker, FastAPI, Python"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
                  className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3.5 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-hover)]"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3 py-2 bg-[var(--btn-sec-bg)] hover:bg-[var(--btn-sec-hover)] text-[var(--btn-sec-text)] rounded-lg text-xs font-medium border border-[var(--border-color)] flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((sk) => (
                  <span
                    key={sk}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-medium"
                  >
                    {sk}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(sk)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Upload CV (PDF or DOCX)
              </label>
              <div className="relative border-2 border-dashed border-[var(--border-color)] hover:border-[var(--border-hover)] rounded-xl p-4 text-center transition bg-[var(--input-bg)] group cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => setCvFile(e.target.files[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center group-hover:scale-105 transition">
                    {cvFile ? <FileText className="w-4 h-4 text-emerald-500" /> : <UploadCloud className="w-4 h-4" />}
                  </div>
                  {cvFile ? (
                    <div>
                      <div className="text-xs font-semibold text-emerald-500 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {cvFile.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {(cvFile.size / 1024).toFixed(1)} KB • Click to change
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-medium text-[var(--text-primary)]">
                        Drag & drop your CV file here or browse
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">PDF or DOCX (Max 10MB)</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--border-color)]">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)]">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[var(--text-primary)]">Demo Job & Position Selection</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">Customize the target position for your interview</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Target Position / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Full-Stack Developer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3.5 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-hover)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]"
                  >
                    <option value="Software & Technology">Software & Technology</option>
                    <option value="AI & Data Science">AI & Data Science</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Marketing & Sales">Marketing & Sales</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Interview Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Position Details & Expectations
                </label>
                <textarea
                  rows="4"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Position expectations and required qualifications..."
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-hover)] resize-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-color)]">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-6 rounded-lg bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition duration-150 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[var(--btn-primary-text)] border-t-transparent rounded-full animate-spin" />
                    <span>Preparing Interview...</span>
                  </>
                ) : (
                  <>
                    <span>Start Interview</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

      </form>

      </div>
    </div>
  );
}

