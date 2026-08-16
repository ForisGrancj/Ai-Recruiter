from rest_framework.generics import CreateAPIView, ListCreateAPIView
from rest_framework.response import Response
from rest_framework import status

from backend.models.interviewsession import InterviewSession
from backend.serializers.serializer import InterviewSessionSerializer, InterviewQuestionSerializer
from backend.services.interview_service import (
    create_interview_session_service,
    process_candidate_answer_service,
)
from backend.services.evaluation_service import evaluate_interview_session_service


def get_request_api_key(request):
    return request.headers.get('X-Gemini-API-Key') or request.META.get('HTTP_X_GEMINI_API_KEY')


class InterviewSessionListCreateView(ListCreateAPIView):
    queryset = InterviewSession.objects.all().order_by('-id')
    serializer_class = InterviewSessionSerializer

    def create(self, request, *args, **kwargs):
        candidate_id = request.data.get('candidate') or request.data.get('candidate_id')
        job_posting_id = request.data.get('job_posting') or request.data.get('job_posting_id')
        api_key = get_request_api_key(request)

        if not candidate_id or not job_posting_id:
            return Response(
                {"error": "'candidate' and 'job_posting' parameters must be provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        session = create_interview_session_service(
            candidate_id=candidate_id,
            job_posting_id=job_posting_id,
            api_key=api_key
        )

        serializer = self.get_serializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AnswerQuestionView(CreateAPIView):
    serializer_class = InterviewQuestionSerializer

    def create(self, request, *args, **kwargs):
        session_id = request.data.get('session_id')
        user_answer = request.data.get('answer')
        api_key = get_request_api_key(request)

        if not session_id or not user_answer:
            return Response(
                {"error": "'session_id' and 'answer' parameters must be provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_question = process_candidate_answer_service(
            session_id=session_id,
            user_answer=user_answer,
            api_key=api_key
        )

        serializer = self.get_serializer(new_question)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EvaluateInterviewView(CreateAPIView):
    serializer_class = InterviewSessionSerializer

    def create(self, request, *args, **kwargs):
        session_id = request.data.get('session_id')
        api_key = get_request_api_key(request)

        if not session_id:
            return Response(
                {"error": "'session_id' parameter must be provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        session = evaluate_interview_session_service(session_id=int(session_id), api_key=api_key)
        serializer = self.get_serializer(session)
        return Response(serializer.data, status=status.HTTP_200_OK)
