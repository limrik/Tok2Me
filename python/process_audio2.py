import sys
import json

from summarise import summarise
from keyword_extract import extract_keywords
from task_analyse import extract_fua

from functions_reference import split_cust_sales_mock

def parse_and_extract_info(txt_path):
    # Initialize variables to store conversation data

    conversations = []

    # Open the text file
    with open(txt_path, 'r') as file:
        lines = file.readlines()

    # Parse the transcript
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip lines until Transcript section
        if line.startswith("Transcript:"):
            i += 1
            break
        i += 1

    # Now parse the conversation lines
    speaker = None
    first_speaker = speaker
    is_first_speaker = False

    while i < len(lines):
        line = lines[i].strip()

        if line.startswith("Keywords:") or not line:
            i += 1
            continue  # Skip Keywords line or empty lines

        # Determine speaker
        if speaker is None:
            speaker = line.split()[0]
            i += 1

            if not is_first_speaker: 
                first_speaker = speaker
                is_first_speaker = True
            
            continue

        # Collect message until next empty line or end of file
        message = []
        while i < len(lines) and lines[i].strip():
            message.append(lines[i].strip())
            i += 1

        # Join message lines into a single message
        message = ' '.join(message)

        # Determine role based on speaker
        role = "salesman" if speaker == first_speaker else "customer"

        # Format the message into the desired structure
        convo_entry = {
            "speaker": speaker,
            "role": role,
            "message": message
        }
        conversations.append(convo_entry)

        # Reset speaker for the next conversation
        speaker = None

    # summarise now
    test_dict = split_cust_sales_mock(conversations)
    test_cust, test_sales = test_dict["split"]
    full_test_cust, full_test_sales = test_dict["full"]

    full_transcript = ' '.join(
        'Customer: ' + line['message'] if line['role'] == 'customer' else 'Salesman: ' + line['message']
        for line in conversations
    )

    summary = summarise(full_test_cust)
    keywords = extract_keywords(full_transcript)
    raw_tasks = extract_fua(conversations)

    filtered_tasks = list(filter(lambda x: x['timeframe'] != '', raw_tasks))

    if len(filtered_tasks) == 0:
        filtered_tasks = raw_tasks

    text_tasks = list(map(lambda y: y['entity'], filtered_tasks))

    return {
        'data': conversations,
        'summary': summary,
        'keywords': keywords,
        'tasks': text_tasks
    }

if __name__ == "__main__":
    txt_path = sys.argv[1]
    results = parse_and_extract_info(txt_path)
    print(json.dumps(results))  # Output JSON to stdout

