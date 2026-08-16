from django.db import models

class CandidateProfile(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    desired_roles = models.TextField(null=True, blank=True)
    cv_file = models.FileField(upload_to='cvs/', null=True, blank=True)
    is_indexed = models.BooleanField(default=False)

