
from django.db import models
from backend.models.candidateprofile import CandidateProfile
from backend.models.jobposting import JobPosting

class InterviewSession(models.Model):
    candidate = models.ForeignKey(CandidateProfile, on_delete=models.CASCADE)
    job_posting = models.ForeignKey(JobPosting, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, default='in_progress')
    score = models.IntegerField(null=True, blank=True)
    verdict = models.CharField(max_length=20, null=True, blank=True)
    ai_evaluation = models.TextField(null=True, blank=True)