import spacy
import sys
import json 

# Load the SpaCy English model
nlp = spacy.load("en_core_web_sm")

# Define follow-up keywords
follow_up_keywords = ["schedule", "follow up", "set up", "arrange", "send", "discuss", "plan"]

# Function to extract follow-up actions with complete entities
def extract_fua(convo):
    follow_up_actions = []
    for message in convo:
        doc = nlp(message["message"])
        for keyword in follow_up_keywords:
            if keyword in message["message"].lower():
                # Find the root verb and its dependencies
                for token in doc:
                    if token.lemma_ in keyword.split():
                        action_phrase = []
                        object_phrase = []
                        for child in token.children:
                            # Collect all words related to the action
                            if child.dep_ in ("dobj", "prep", "pobj", "advmod", "amod", "attr"):
                                if child.dep_ == "dobj":
                                    object_phrase.append(child.text)
                                    for subchild in child.children:
                                        object_phrase.append(subchild.text)
                                else:
                                    action_phrase.append(child.text)
                                    for subchild in child.children:
                                        action_phrase.append(subchild.text)
                        object_phrase = ' '.join(sorted(set(object_phrase), key=lambda x: doc.text.find(x)))
                        # Extract temporal entities (e.g., dates, times, durations) from the processed text
                        timeframe = ""
                        for ent in doc.ents:
                            if ent.label_ in ["DATE", "TIME", "DURATION"]:
                                timeframe = ent.text
                                break  # Take the first temporal entity found

                        # Synthesize entity and timeframe properly
                        task_with_object = f"{keyword} {object_phrase}".strip()
                        entity_with_timeframe = f"{task_with_object} by {timeframe}" if timeframe else task_with_object

                        follow_up_actions.append({
                            "speaker": message["speaker"],
                            "role": message["role"],
                            "message": message["message"],
                            "action": keyword,
                            "entity": entity_with_timeframe.strip(),
                            "timeframe": timeframe
                        })
    return follow_up_actions

if __name__ == "__main__":
    with open(sys.argv[1], 'r') as file:
        conversations = json.load(file)
        tasks = extract_fua(conversations)
        print(json.dumps(tasks))