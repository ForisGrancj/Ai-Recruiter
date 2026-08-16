from backend.services.vector_db import search_cv_context
from backend.services.ai_service import ask_llm
from backend.models.candidateprofile import CandidateProfile
from backend.models.interviewsession import InterviewSession
from backend.models.interviewquestion import InterviewQuestion


def generate_initial_question_from_cv(candidate_id: int, job_title: str) -> str:
    candidate = CandidateProfile.objects.filter(id=candidate_id).first()
    desired_roles = candidate.desired_roles if candidate else ""
    candidate_name = candidate.first_name if candidate else "Candidate"

    cv_summary = search_cv_context(
        candidate_id=candidate_id,
        query_text="experience, projects, achievements, technologies, skills, education",
        top_k=4
    )

    prompt = f"""
    You are Aura, an elite, highly perceptive human Senior Executive Interviewer conducting a realistic, dynamic interview for the candidate '{candidate_name}' applying for '{job_title}'.

    APPLICATION POSITION: {job_title}
    CANDIDATE SKILLS & TARGET ROLES: {desired_roles if desired_roles else 'Not specified'}

    CANDIDATE CV CONTENT (Qdrant RAG):
    {cv_summary if cv_summary else 'No specific CV excerpt available.'}

    TASK & INTERVIEWER INSTRUCTIONS:
    - Generate ONE compelling, personalized opening interview question tailored specifically to this candidate.
    - Act like a sharp human interviewer who has thoroughly read their CV and skills: pick a specific technology, project, or experience claim mentioned in their CV/skills, and ask a deep technical or practical background question about it.
    - Do NOT ask generic greetings like "Welcome, introduce yourself" or "Tell me about yourself".
    - Respond in professional English.
    - Return ONLY the question sentence without any greetings prefix or Markdown formatting.
    """

    question = ask_llm(prompt)

    if not question or not question.strip():
        question = f"Welcome! Could you briefly share your key technical background and how your experience aligns with the {job_title} position?"

    return question.strip()


def generate_followup_question(session_id: int, candidate_answer: str) -> str:
    session = InterviewSession.objects.filter(id=session_id).first()
    if not session:
        return "Thank you. Could you provide a bit more detail about your background relevant to this role?"

    candidate = session.candidate
    job_posting = session.job_posting

    all_questions = InterviewQuestion.objects.filter(session=session).order_by('id')
    history_text = ""
    for idx, q in enumerate(all_questions, 1):
        history_text += f"\n[Question {idx}]: {q.question_text}\n"
        if q.candidate_answer:
            history_text += f"[Candidate Answer {idx}]: {q.candidate_answer}\n"

    relevant_cv_context = search_cv_context(
        candidate_id=candidate.id,
        query_text=f"{candidate_answer} {job_posting.title} {candidate.desired_roles or ''}",
        top_k=3
    )

    prompt = f"""
    You are Aura, an empathetic yet sharp, highly experienced human Senior Executive Interviewer interviewing candidate '{candidate.first_name} {candidate.last_name}' for the '{job_posting.title}' position.

    APPLICATION POSITION: {job_posting.title}
    JOB DESCRIPTION: {job_posting.description}
    CANDIDATE SKILLS & ROLES: {candidate.desired_roles if candidate.desired_roles else 'Not specified'}

    RELEVANT CV EXCERPT (Qdrant RAG):
    {relevant_cv_context if relevant_cv_context else 'No specific CV excerpt found.'}

    FULL INTERVIEW CONVERSATION HISTORY SO FAR:
    {history_text if history_text else 'First follow-up question.'}

    CANDIDATE'S LATEST RESPONSE:
    "{candidate_answer}"

    HUMAN-LIKE DYNAMIC INTERVIEWING RULES:

    1. NO ROBOTIC REPETITION & NO SAFE PREDICTABLE QUESTIONS:
       Review the conversation history. NEVER repeat topics or questions already covered. Adapt dynamically like a real human interviewer who evaluates technical depth, problem-solving under pressure, social/communication skills, and teamwork.

    2. DYNAMIC MULTI-DIMENSIONAL TESTING MATRIX:
       Vary your questioning across different dimensions:
       - Technical Architecture & Deep-Dive: Ask about real-world trade-offs, scalability, edge-cases, system design, or debugging tough bugs.
       - Behavioral & Social / Conflict Management: Test soft skills, team collaboration, handling tight deadlines, disagreeing with a tech lead/manager, or overcoming a major project failure.
       - Practical Problem-Solving / Stress Scenario: Give a realistic operational or technical emergency scenario and ask how they would handle it.
       - CV Claim Cross-Examination: Probe specific tools, companies, or accomplishments listed on their CV/skills.

    3. PROBE VAGUE OR BUZZWORD-HEAVY ANSWERS:
       If the candidate gives a superficial, vague, generic, or overly brief answer, call it out gracefully and challenge them to explain the EXACT mechanism, step-by-step process, or real example.

    4. TERMINATION LOGIC:
       If the candidate explicitly requests to end (e.g. "interview is over", "bye", "stop") or gives nonsensical/trolling answers ("asdf", "idk", "no idea", "don't care"):
       Politely conclude the interview session with a warm closing statement. Do NOT ask another question.

    5. FORMAT:
       - 1 natural conversational sentence reacting to their answer (e.g. validating, probing, or contrasting).
       - Followed by ONE focused, thought-provoking question on a new or deeper dimension.
       - Keep overall length to 2-3 natural sentences in professional English.
       - Return ONLY the response text without Markdown formatting.
    """

    res = ask_llm(prompt)

    if not res or not res.strip():
        ans_lower = (candidate_answer or '').strip().lower()
        if any(term in ans_lower for term in ['dont know', "don't know", 'idk', 'no idea', '???', 'asdf', 'over', 'end', 'stop', 'bye']):
            res = f"Thank you for your time and honesty. We conclude our interview session for the {job_posting.title} position here. We wish you the best in your career!"
        else:
            res = f"Thank you for sharing your thoughts. Given the responsibilities for the {job_posting.title} role, could you describe a challenging scenario or technical conflict you resolved in your previous experience?"

    return res.strip()