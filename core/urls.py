from django.contrib import admin
from django.urls import path
from backend.views import (
    JobPostingListCreateAPIView,
    CandidateCreateView,
    InterviewSessionListCreateView,
    AnswerQuestionView,
    EvaluateInterviewView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Jobs API
    path('jobs/', JobPostingListCreateAPIView.as_view(), name='job-list-create'),

    # Candidate CV Upload API
    path('candidates/upload-cv/', CandidateCreateView.as_view(), name='candidate-upload-cv'),

    # Interview Session APIs
    path('interviews/', InterviewSessionListCreateView.as_view(), name='interview-list-create'),
    path('interviews/answer/', AnswerQuestionView.as_view(), name='interview-answer'),
    path('interviews/evaluate/', EvaluateInterviewView.as_view(), name='interview-evaluate'),
]
