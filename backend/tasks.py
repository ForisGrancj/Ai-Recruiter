from celery import shared_task
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from backend.models.candidateprofile import CandidateProfile
from backend.services.vector_db import insert_cv_chunk


@shared_task
def process_and_index_cv(candidate_id: int, api_key: str = None):
    try:
        profile = CandidateProfile.objects.get(id=candidate_id)
        if not profile.cv_file:
            return f"Candidate {candidate_id} has no CV file."

        reader = PdfReader(profile.cv_file.path)
        raw_text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                raw_text += extracted + "\n"

        if not raw_text.strip():
            return f"No readable text in CV for candidate {candidate_id}."

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100
        )
        chunks = text_splitter.split_text(raw_text)[:12]

        for chunk in chunks:
            insert_cv_chunk(candidate_id=candidate_id, chunk_text=chunk, api_key=api_key)

        profile.is_indexed = True
        profile.save()

        return f"Candidate {candidate_id} CV indexed successfully with {len(chunks)} chunks."

    except CandidateProfile.DoesNotExist:
        return f"Candidate {candidate_id} not found."
    except Exception as e:
        print(f">>> WARNING: Indexing failed for candidate {candidate_id}: {e}")
        return f"Error indexing CV for candidate {candidate_id}: {str(e)}"
