from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from backend.models.candidateprofile import CandidateProfile
from backend.serializers.serializer import CandidateProfileSerializer
from backend.tasks import process_and_index_cv

class CandidateCreateView(APIView):
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        
        if email:
            existing_candidate = CandidateProfile.objects.filter(email__iexact=email.strip()).first()
            if existing_candidate:
                serializer = CandidateProfileSerializer(existing_candidate, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                candidate = serializer.save()
                
                if 'cv_file' in request.FILES:
                    process_and_index_cv.delay(candidate.id)
                
                serialized_data = serializer.data
                serialized_data['id'] = candidate.id
                return Response({
                    "message": "Candidate profile updated.",
                    "candidate": serialized_data,
                    "id": candidate.id
                }, status=status.HTTP_200_OK)

        serializer = CandidateProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        candidate = serializer.save()
        
        if candidate.cv_file:
            process_and_index_cv.delay(candidate.id)
            
        serialized_data = serializer.data
        serialized_data['id'] = candidate.id
        return Response({
            "message": "Candidate profile created successfully.",
            "candidate": serialized_data,
            "id": candidate.id
        }, status=status.HTTP_201_CREATED)

