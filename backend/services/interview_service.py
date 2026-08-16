from django.shortcuts import get_object_or_404
from backend.models.interviewsession import InterviewSession
from backend.models.interviewquestion import InterviewQuestion
from backend.services.rag_service import (
    generate_initial_question_from_cv,
    generate_followup_question
)

def create_interview_session_service(candidate_id: int, job_posting_id: int) -> InterviewSession:
    session = InterviewSession.objects.create(
        candidate_id=candidate_id,
        job_posting_id=job_posting_id,
        status="in_progress"
    )

    first_question_text = generate_initial_question_from_cv(
        candidate_id=candidate_id,
        job_title=session.job_posting.title
    )

    InterviewQuestion.objects.create(
        session=session,
        question_text=first_question_text,
        is_followup=False
    )

    return session

def process_candidate_answer_service(session_id: int, user_answer: str) -> InterviewQuestion:
    session = get_object_or_404(InterviewSession, id=session_id)

    last_question = InterviewQuestion.objects.filter(session=session).last()
    if last_question:
        last_question.candidate_answer = user_answer
        last_question.save()

    new_question_text = generate_followup_question(
        session_id=session.id,
        candidate_answer=user_answer
    )

    new_question = InterviewQuestion.objects.create(
        session=session,
        question_text=new_question_text,
        is_followup=True
    )

    return new_question

