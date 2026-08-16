import json
import re
from django.shortcuts import get_object_or_404
from backend.models.interviewsession import InterviewSession
from backend.models.interviewquestion import InterviewQuestion
from backend.services.vector_db import search_cv_context
from backend.services.ai_service import ask_llm


def evaluate_interview_session_service(session_id: int, api_key: str = None) -> InterviewSession:
    session = get_object_or_404(InterviewSession, id=session_id)
    questions = InterviewQuestion.objects.filter(session=session).order_by('id')

    transcript_text = ""
    for idx, q in enumerate(questions, 1):
        transcript_text += f"\nQ{idx}: {q.question_text}\n"
        transcript_text += f"Candidate Answer: {q.candidate_answer if q.candidate_answer else '[No answer provided]'}\n"

    cv_summary = search_cv_context(
        candidate_id=session.candidate_id,
        query_text=session.job_posting.title,
        top_k=3,
        api_key=api_key
    )

    prompt = f"""
    You are an automated AI Executive Recruitment Robot evaluating a completed interview.

    JOB POSITION: {session.job_posting.title}
    JOB DESCRIPTION: {session.job_posting.description}

    CANDIDATE CV CONTEXT (Qdrant RAG):
    {cv_summary if cv_summary else "No specific CV excerpt."}

    FULL INTERVIEW TRANSCRIPT:
    {transcript_text if transcript_text else "No interview transcript recorded."}

    TASK:
    Analyze the candidate's answers, technical depth, communication, and alignment with the job requirements.
    Return a valid JSON object strictly formatted as:
    {{
        "score": <integer score from 0 to 100>,
        "verdict": "<HIRE, HOLD, or REJECT>",
        "summary": "<2-3 sentence executive summary of candidate performance>",
        "strengths": ["<strength 1>", "<strength 2>"],
        "weaknesses": ["<weakness 1>", "<weakness 2>"],
        "hiring_recommendation": "<Detailed recommendation for hiring manager>"
    }}

    Return ONLY the raw JSON object without any Markdown fenced code blocks or extra text.
    """

    raw_response = ask_llm(prompt, api_key=api_key)

    cleaned_json = raw_response.strip()
    if cleaned_json.startswith("```"):
        cleaned_json = re.sub(r"^```(?:json)?", "", cleaned_json).rstrip("`").strip()

    try:
        data = json.loads(cleaned_json)
        score = int(data.get("score", 70))
        verdict = str(data.get("verdict", "UNDER_REVIEW")).upper()
        summary = data.get("summary", "Evaluation complete.")
        strengths = data.get("strengths", [])
        weaknesses = data.get("weaknesses", [])
        rec = data.get("hiring_recommendation", "")

        evaluation_report = f"""SUMMARY:
{summary}

VERDICT: {verdict} (Score: {score}/100)

STRENGTHS:
- """ + "\n- ".join(strengths) + f"""

AREAS FOR IMPROVEMENT:
- """ + "\n- ".join(weaknesses) + f"""

HIRING MANAGER RECOMMENDATION:
{rec}"""

        session.score = score
        session.verdict = verdict
        session.ai_evaluation = evaluation_report.strip()
        session.status = 'completed'
        session.save()

    except Exception as e:
        print(f">>> WARNING: Failed to parse JSON evaluation from LLM: {e}")
        session.score = 65
        session.verdict = "UNDER_REVIEW"
        session.ai_evaluation = f"AI Evaluation Report for {session.job_posting.title}:\n\nTranscript reviewed. Candidate completed {questions.count()} questions."
        session.status = 'completed'
        session.save()

    return session


