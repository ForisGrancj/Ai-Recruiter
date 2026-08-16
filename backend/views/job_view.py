from rest_framework.generics import ListCreateAPIView
from backend.models.jobposting import JobPosting
from backend.serializers.serializer import JobPostingSerializer


class JobPostingListCreateAPIView(ListCreateAPIView):
    queryset = JobPosting.objects.all().order_by('-created_at')
    serializer_class = JobPostingSerializer
