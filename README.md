# Tok2Me

## Inspiration

Inspired by Otter.ai, we wanted to improve the efficiency of a TikTok salesperson when communicating with countless clients, ensuring that the key information from the conversation is not lost.

## What it does

Tok2Me is a Lark Bot capable of analysing a video meeting between a TikTok salesperson and their clients. At the end of a recorded video meeting, the Tok2Me bot waits for the recording to be processed before notifying the TikTok salesperson with the link to the meeting recording where the salesperson can download the meeting transcript and upload it to the Tok2Me bot. The Tok2Me bot then analyses the transcript and provides a concise summary, a list of actionable actions and highlights keywords to the salesperson. Finally, a Task List with the Tasks are automatically created on Lark. This enables the salesperson to be able to quickly refresh their memory of a past conversation through the summary and keep track if they have completed all the follow-up actions from the conversation. Not only does this increase the efficiency of the salesperson, it also improves the relationship with the client as important tasks are followed up timely and subsequent meetings can continue where they left off.

## How we built it

### 1. Lark Bot Integration

We used the Lark Developer Suite to set up the Lark Bot. We configured the Tok2Me bot to listen for events such as video meetings ending and private messages sent to the Lark Bot. We also allowed permissions for the Lark Bot to obtain video meeting details, creating task lists and tasks and sending messages to chats.

### 2. Generation of Summary

We made use of the [kabita-choudhary/finetuned-bart-for-conversation-summary model](https://huggingface.co/kabita-choudhary/finetuned-bart-for-conversation-summary) from Hugging Face. Our backend processes the meeting transcript uploaded by the salesperson, cleans it up, and uses this fine-tuned BART model to generate a concise and coherent summary of the meeting.

### 3. Consolidation of Actionable Tasks

Our system employs an advanced NLP pipeline, powered by SpaCy, to identify and extract follow-up actions from the meeting transcripts. By defining a set of follow-up keywords (e.g., "schedule", "follow up", "set up", "arrange", "send", "discuss", "plan"), we can pinpoint specific action items mentioned during the conversation.

The extraction process involves:

- Analyzing the meeting transcript to locate keywords associated with follow-up actions.
- Identifying the root verb and its dependencies within the sentence to capture the complete action phrase.
- Recognizing temporal entities (e.g., dates, times, durations) to provide context for the follow-up actions.
- Synthesizing the action items into a structured format that includes the speaker, role, original message, action, entity, and timeframe.

### 4. Extraction of Keywords

We have integrated the [transformer3/H2-keywordextractor transformer](https://huggingface.co/transformer3/H2-keywordextractor) for keyword extraction, which helps in highlighting the most critical points discussed in the meeting.

## Challenges we ran into

Initially we tried to use the audio file from the meeting recording instead of the text transcript. We wanted to convert the speech to text ourselves and perform speaker diarization to discern the portions each speaker spoke during the meeting. However, this did not go as planned as the pre-trained models found it hard to pick up the audio and we found TikTok's speech to text to be superior and decided to opt to use the transcript they generated instead.

## Accomplishments that we're proud of

Having previously only developed web applications, we are proud of our first time venturing into AI/ML projects and also the integration of a Lark bot. We faced many bugs along the way and are glad we powered through and did not rely on falling back to the technologies we were familiar with but instead took every step as a learning opportunity.

## What's next for Tok2Me

Continuing from this project, we would hope to be able to work with TikTok to allow us to automatically send the TikTok transcript from their servers to our backend without the need for our salesperson to download it and upload it to the bot. This service is currently unavailable but our workaround involves the need for the salesperson's intervention which we hope to streamline.

We would also like to further optimise the ML models and train models from actual TikTok data instead of using pre-trained models as this would greatly improve our accuracy in generating summaries and picking out actionable tasks.

We also want to be able to analyse emotions within the conversation and generate a sentient analysis of the meeting. This would help the salesperson understand their clients on a more personal level, enabling them to better connect with their clients and take on different approaches for different profiles of clients.
