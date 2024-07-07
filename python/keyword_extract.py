# Load model directly
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM 
import torch
import sys

keyword_tokenizer = AutoTokenizer.from_pretrained("transformer3/H2-keywordextractor")
keyword_model = AutoModelForSeq2SeqLM.from_pretrained("transformer3/H2-keywordextractor")

def extract_keywords(text):
    # Load the tokenizer and model
    
    # Step 1: Tokenize the input text
    inputs = keyword_tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    
    # Step 2: Generate keywords
    with torch.no_grad():
        outputs = keyword_model.generate(**inputs, max_length=50, num_beams=5, early_stopping=True)
    
    # Step 3: Decode the output
    keywords = keyword_tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    return keywords

if __name__ == "__main__":
    with open(sys.argv[1], 'r') as file:
        text = file.read()
        print(extract_keywords(text))