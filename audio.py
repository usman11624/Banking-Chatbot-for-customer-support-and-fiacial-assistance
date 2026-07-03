import os
from openai import OpenAI

WHISPER_AVAILABLE = True

def transcribe_audio_file(file_path):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is missing")
    
    # Groq uses the standard OpenAI python client for its audio transcriptions
    client = OpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1"
    )

    with open(file_path, "rb") as file:
        transcription = client.audio.transcriptions.create(
            file=(os.path.basename(file_path), file.read()),
            model="whisper-large-v3",
            response_format="json",
            temperature=0.0
        )
    return transcription.text
