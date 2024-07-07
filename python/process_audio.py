import sys
from pyannote.audio import Pipeline
from pyannote.core import Segment
import speech_recognition as sr
from pydub import AudioSegment
import os
import json

from summarise import summarise
from keyword_extract import extract_keywords
from task_analyse import extract_fua

from functions_reference import split_cust_sales_mock


def diarize_and_transcribe(wav_path):
    # Load pretrained pipeline for speaker diarization
    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token="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"
    )

    # Perform speaker diarization on the WAV file
    diarization = pipeline(wav_path)

    # Initialize speech recognizer
    recognizer = sr.Recognizer()

    # Load the audio file using pydub
    audio = AudioSegment.from_wav(wav_path)

    results = []

    # Iterate over each diarized segment
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        # Extract the audio segment
        start = turn.start * 1000  # pydub works in milliseconds
        end = turn.end * 1000
        segment = audio[start:end]

        # Save the segment to a temporary file
        segment_path = f"temp_{speaker}_{start}_{end}.wav"
        segment.export(segment_path, format="wav")

        # Perform speech recognition on the segment
        with sr.AudioFile(segment_path) as source:
            audio_data = recognizer.record(source)
            try:
                transcription = recognizer.recognize_google(audio_data)
            except sr.UnknownValueError:
                transcription = "[Unintelligible]"
            except sr.RequestError as e:
                transcription = f"[Error: {e}]"

        # Determine role based on speaker label (example logic, adjust as needed)
        role = "salesman" if speaker == "SPEAKER_00" else "customer"

        # Append the result with speaker info, role, and transcription
        results.append({
            "speaker": speaker,
            "role": role,
            "message": transcription
        })

        # Clean up the temporary file
        os.remove(segment_path)


    # summarise now
    test_dict = split_cust_sales_mock(results)
    test_cust, test_sales = test_dict["split"]
    full_test_cust, full_test_sales = test_dict["full"]

    full_transcript = ' '.join(
        'Customer: ' + line['message'] if line['role'] == 'customer' else 'Salesman: ' + line['message']
        for line in results
    )

    summary = summarise(full_test_cust)
    keywords = extract_keywords(full_transcript)
    raw_tasks = extract_fua(results)

    filtered_tasks = list(filter(lambda x: x['timeframe'] != '', raw_tasks))

    if len(filtered_tasks) == 0:
        filtered_tasks = raw_tasks

    text_tasks = list(map(lambda y: y['entity'], filtered_tasks))

    return {
        'data': results,
        'summary': summary,
        'keywords': keywords,
        'tasks': text_tasks
    }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python process_audio.py <wav_file_path>")
        sys.exit(1)

    wav_file_path = sys.argv[1]
    result = diarize_and_transcribe(wav_file_path)

    with open("output.json", "w") as outfile:
        json.dump(result, outfile, indent=4)

    print(json.dumps(result, indent=4))
