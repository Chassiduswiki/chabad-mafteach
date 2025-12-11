from fastapi import FastAPI
from transformers import pipeline
from tokenizers.decoders import WordPiece

app = FastAPI()

generator = None
ner_oracle = None

def get_generator():
    global generator
    if generator is None:
        generator = pipeline('text-generation', model="dicta-il/DictaLM-3.0-24B-Thinking")
    return generator

def get_ner_oracle():
    global ner_oracle
    if ner_oracle is None:
        ner_oracle = pipeline('ner', model='dicta-il/dictabert-ner', aggregation_strategy='simple')
        ner_oracle.tokenizer.backend_tokenizer.decoder = WordPiece()
    return ner_oracle

@app.post("/generate")
def generate_text(prompt: str):
    gen = get_generator()
    messages = [{"role": "user", "content": prompt}]
    result = gen(messages)
    return {"response": result[0]['generated_text'][-1]['content']}

@app.post("/ner")
def extract_entities(text: str):
    ner = get_ner_oracle()
    entities = ner(text)
    return {"entities": entities}

@app.post("/citation_recognize")
def recognize_citations(text: str):
    # Basic: extract entities, filter for potential citations (e.g., PER, GPE as authors/sources)
    ner = get_ner_oracle()
    entities = ner(text)
    citations = [e for e in entities if e['entity_group'] in ['PER', 'GPE']]  # Placeholder logic
    return {"citations": citations}
