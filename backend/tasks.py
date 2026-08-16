from celery import shared_task
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from backend.models.candidateprofile import CandidateProfile
from backend.services.vector_db import insert_cv_chunk


@shared_task
def process_and_index_cv(candidate_id: int):
    try:
        profile = CandidateProfile.objects.get(id=candidate_id)

        reader = PdfReader(profile.cv_file.path)
        raw_text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                raw_text += extracted + "\n"

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=400,
            chunk_overlap=50
        )
        chunks = text_splitter.split_text(raw_text)

        for chunk in chunks:
            insert_cv_chunk(candidate_id=candidate_id, chunk_text=chunk)

        profile.is_indexed = True
        profile.save()

        return f"Candidate {candidate_id} CV indexed successfully with {len(chunks)} chunks."

    except CandidateProfile.DoesNotExist:
        return f"Candidate {candidate_id} not found."
    except Exception as e:
        return f"Error indexing CV for candidate {candidate_id}: {str(e)}"