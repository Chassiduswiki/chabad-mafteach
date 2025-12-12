# Chabad Research NLP Service

This service provides Hebrew text analysis capabilities using Dicta-Israel-Center-for-Text-Analysis models, specifically integrated for citation recognition and entity extraction in Chabad research texts.

## Overview

The NLP service leverages state-of-the-art Hebrew language models:
- **Dictabert-ner**: Named Entity Recognition for Hebrew texts
- **DictaLM-3.0-24B-Thinking**: Large language model for Hebrew text generation
- **Citation Recognition**: Filters NER results to identify potential citations

## Installation

### Prerequisites
- Python 3.9+
- Virtual environment (recommended)

### Setup
```bash
cd nlp-service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install fastapi uvicorn transformers torch
```

## Running Locally

Start the service:
```bash
cd nlp-service
source venv/bin/activate
uvicorn app:app --reload --host 0.0.0.0 --port 8001
```

The service will be available at `http://localhost:8001`

## API Endpoints

### POST /generate
Generate text using DictaLM.

**Request:**
```json
{
  "prompt": "איזה רוטב אהוב עליך?"
}
```

**Response:**
```json
{
  "response": "Generated text in Hebrew"
}
```

### POST /ner
Extract named entities from Hebrew text.

**Request:**
```json
{
  "text": "דוד בן-גוריון היה ראש הממשלה של ישראל"
}
```

**Response:**
```json
{
  "entities": [
    {
      "entity_group": "PER",
      "score": 0.9999443,
      "word": "דוד בן-גוריון",
      "start": 0,
      "end": 13
    },
    {
      "entity_group": "GPE",
      "score": 0.9997943,
      "word": "ישראל",
      "start": 96,
      "end": 101
    }
  ]
}
```

### POST /citation_recognize
Recognize potential citations by filtering NER entities.

**Request:**
```json
{
  "text": "ראה בתניא אגרת התשובה פרק ב׳"
}
```

**Response:**
```json
{
  "citations": [
    {
      "entity_group": "PER",
      "score": 0.95,
      "word": "תניא",
      "start": 5,
      "end": 9
    }
  ]
}
```

## Integration with Frontend

### Editor Citation Detection

The frontend editor uses the NLP service for automatic citation recognition:

1. **Citation Plugin**: When users type or paste text, the editor calls `/api/citations/detect`
2. **API Route**: `/app/api/citations/detect/route.ts` forwards requests to the NLP service
3. **Entity Highlighting**: Detected entities are highlighted in the editor
4. **Modal Viewer**: Citations can be clicked to open a modal with details

**Integration Flow:**
```
Editor Text Input → /api/citations/detect → NLP /citation_recognize → Entity Highlights
```

**Frontend Code Example:**
```typescript
// Call citation detection
const response = await fetch('/api/citations/detect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: editorContent })
});
```

### Citation Modal

The `CitationViewerModal` component displays citation details fetched from the NLP service.

## Integration with Backend (Directus)

The NLP service runs as a separate microservice alongside Directus:

1. **Separation of Concerns**: NLP processing is decoupled from Directus database operations
2. **API Calls**: Frontend makes HTTP calls to NLP service (localhost in dev, Railway URL in prod)
3. **Fallback Handling**: If NLP service is unavailable, basic pattern matching provides fallback
4. **Scalability**: NLP service can be scaled independently

**Architecture:**
```
Frontend (Next.js) ↔ Directus API ↔ Database
       ↓
NLP Service (FastAPI) ↔ HuggingFace Models
```

## Integration with Railway

### Deployment

1. **Create Railway Project**: Push the `nlp-service` directory to a Git repository
2. **Railway Configuration**: Add environment variables if needed
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`

### Environment Variables
```env
PORT=8000  # Railway assigns this automatically
```

### Production URL

Once deployed, update frontend configuration to use Railway URL instead of localhost:

**In `/app/api/citations/detect/route.ts`:**
```typescript
const nlpResponse = await fetch('https://your-railway-nlp-service.up.railway.app/citation_recognize', {
  // ...
});
```

## Testing

### Local Testing

Test individual endpoints:
```bash
# Test NER
curl -X POST http://localhost:8001/ner \
  -H "Content-Type: application/json" \
  -d '{"text": "דוד בן-גוריון היה ראש הממשלה"}'

# Test Citation Recognition
curl -X POST http://localhost:8001/citation_recognize \
  -H "Content-Type: application/json" \
  -d '{"text": "ראה בתורה אור פרק י״ב"}'
```

### Integration Testing

1. Start both frontend and NLP service
2. Create/edit content in the editor
3. Verify citations are detected and highlighted
4. Click citations to open modal

### Performance Notes

- First request to each endpoint may take 10-30 seconds due to model loading
- Subsequent requests are fast (<1 second)
- Models are cached locally after first use

## Configuration

### Model Loading

Models are loaded lazily on first request to improve startup time:
- `get_generator()`: Loads DictaLM for text generation
- `get_ner_oracle()`: Loads Dictabert-ner for NER

### Fallback System

If NLP service is unavailable:
- Frontend falls back to basic regex patterns
- Returns citations with `source: 'fallback'`

## Future Enhancements

- **Nakdan Integration**: Add Hebrew diacritics processing
- **Additional Models**: Integrate more Dicta models (e.g., for sentiment analysis)
- **Batch Processing**: Support multiple texts in single request
- **Caching**: Implement Redis for frequently accessed results

## Troubleshooting

### Common Issues

1. **Model Loading Timeout**: Increase timeout in fetch calls
2. **Memory Usage**: Models require ~8GB RAM; ensure adequate resources
3. **Hebrew Text Encoding**: Ensure UTF-8 encoding for Hebrew characters

### Logs

Check Railway logs for deployment issues:
```bash
railway logs
```

### Local Debugging

Enable debug mode:
```bash
uvicorn app:app --reload --log-level debug
```
