import os

def get_api_key():
    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if key:
        return key
    env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    if k in ("GEMINI_API_KEY", "GOOGLE_API_KEY"):
                        key = v.strip("'\"")
                        os.environ[k] = key
                        return key
    return None

api_key = get_api_key()

try:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key) if api_key else None

    def ask_llm(prompt: str) -> str:
        active_client = client
        if not active_client:
            key = get_api_key()
            if key:
                active_client = genai.Client(api_key=key)
        if not active_client:
            print(">>> ERROR: API Key not found! Please check your .env file.")
            return ""
        try:
            response = active_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            if response and hasattr(response, 'text') and response.text:
                return response.text.strip()
            return ""
        except Exception as e:
            print(f">>> ERROR: Gemini API call failed: {e}")
            return ""

    def get_text_embedding(text: str) -> list[float]:
        """Generates a 768-dimensional vector (embedding) using Gemini."""
        active_client = client
        if not active_client:
            key = get_api_key()
            if key:
                active_client = genai.Client(api_key=key)
        if not active_client:
            print(">>> ERROR: API Key not found! Please check your .env file.")
            return []
        try:
            response = active_client.models.embed_content(
                model="gemini-embedding-001",
                contents=text,
                config=types.EmbedContentConfig(output_dimensionality=768)
            )
            if response and response.embeddings and len(response.embeddings) > 0:
                return response.embeddings[0].values
            return []
        except Exception as e:
            print(f">>> ERROR: Gemini Embedding failed: {e}")
            return []

except ImportError:
    import google.generativeai as genai

    if api_key:
        genai.configure(api_key=api_key)

    model = genai.GenerativeModel('gemini-2.5-flash') if api_key else None

    def ask_llm(prompt: str) -> str:
        try:
            active_model = model
            if not active_model:
                k = get_api_key()
                if k:
                    genai.configure(api_key=k)
                    active_model = genai.GenerativeModel('gemini-2.5-flash')
            if not active_model:
                return ""
            response = active_model.generate_content(prompt)
            if response and hasattr(response, 'text') and response.text:
                return response.text.strip()
            return ""
        except Exception as e:
            print(f">>> ERROR: Gemini API call failed: {e}")
            return ""

    def get_text_embedding(text: str) -> list[float]:
        """Generates a 768-dimensional vector (embedding) using Gemini."""
        try:
            k = get_api_key()
            if k:
                genai.configure(api_key=k)
            result = genai.embed_content(
                model="models/gemini-embedding-001",
                content=text,
                task_type="retrieval_document",
                output_dimensionality=768
            )
            return result['embedding']
        except Exception as e:
            print(f">>> ERROR: Gemini Embedding failed: {e}")
            return []