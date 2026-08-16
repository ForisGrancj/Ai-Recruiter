from django.db import models
from backend.models.companyprofile import CompanyProfile

class JobPosting(models.Model):
    company = models.ForeignKey(CompanyProfile, on_delete=models.CASCADE, related_name='jobs', null=True, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    duration_minutes = models.PositiveIntegerField(default=30, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)