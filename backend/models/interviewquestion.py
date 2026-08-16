from django.db import models
from backend.models.interviewsession import InterviewSession

class InterviewQuestion(models.Model):
    session = models.ForeignKey(InterviewSession, related_name='questions', on_delete=models.CASCADE)
    question_text = models.TextField()
    candidate_answer = models.TextField(null=True, blank=True)
    is_followup = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)