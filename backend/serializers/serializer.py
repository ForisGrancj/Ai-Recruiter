from rest_framework import serializers
from backend.models.interviewsession import InterviewSession
from backend.models.interviewquestion import InterviewQuestion
from backend.models.jobposting import JobPosting
from backend.models.candidateprofile import CandidateProfile

class CandidateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidateProfile
        fields = ['id', 'first_name', 'last_name', 'email', 'phone', 'desired_roles', 'cv_file', 'is_indexed']
        read_only_fields = ['id', 'is_indexed']

    def validate_cv_file(self, value):
        if value and not value.name.endswith(('.pdf', '.docx')):
            raise serializers.ValidationError('cv file must be pdf or docx')
        return value

class InterviewQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewQuestion
        fields = ['id', 'question_text', 'candidate_answer', 'is_followup', 'created_at']

class InterviewSessionSerializer(serializers.ModelSerializer):
    questions = InterviewQuestionSerializer(many=True, read_only=True)
    candidate_name = serializers.CharField(source='candidate.first_name', read_only=True)
    candidate_email = serializers.CharField(source='candidate.email', read_only=True)
    duration_minutes = serializers.IntegerField(source='job_posting.duration_minutes', read_only=True)

    class Meta:
        model = InterviewSession
        fields = ['id', 'candidate', 'candidate_name', 'candidate_email', 'job_posting', 'duration_minutes', 'status', 'score', 'verdict', 'ai_evaluation', 'questions']

class JobPostingSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.company_name', read_only=True)

    class Meta:
        model = JobPosting
        fields = ['id', 'company', 'company_name', 'title', 'description', 'duration_minutes', 'created_at']
