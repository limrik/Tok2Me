from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import sys

summariser_tokenizer = AutoTokenizer.from_pretrained("kabita-choudhary/finetuned-bart-for-conversation-summary")
summariser_model = AutoModelForSeq2SeqLM.from_pretrained("kabita-choudhary/finetuned-bart-for-conversation-summary")

def summarise(text):
    inputs = summariser_tokenizer(text, max_length=1024, truncation=True, return_tensors="pt")
    summary_ids = summariser_model.generate(inputs["input_ids"], max_length=150, min_length=40, length_penalty=2.0, num_beams=4, early_stopping=True)
    summary = summariser_tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    return summary

if __name__ == "__main__":
    with open(sys.argv[1], 'r') as file:
        text = file.read()
        print(summarise(text))
