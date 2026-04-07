# Notes Summarizer & Q/A Frontend

A practical exam-prep frontend for students.

## Features
- Paste notes or upload `.txt`, `.md`, `.pdf`
- Generate:
  - Summary
  - Important questions
  - Quick revision points
- Frontend-only integration with your existing API
- Saves API URL in browser local storage
- Handles multiple response formats (`summary`, `questions`, `revision_points`, etc.)
- Request timeout handling (60s)
- Includes graceful fallback preview when API is unavailable

## Run
1. Open this folder.
2. Start any static server, for example:
   - `python -m http.server 5500`
3. Open `http://localhost:5500`

You can also open `index.html` directly, but using a local server is recommended.

## Integration Contract (Frontend)
Default endpoint:
- `http://localhost:8000/api/summarize`

### Option A: JSON input (paste mode)
POST JSON:
```json
{
  "notes": "your long notes text"
}
```

### Option B: File input (upload mode)
POST multipart/form-data with field:
- `file`: uploaded notes file

### Expected response
```json
{
  "summary": "short summary text",
  "important_questions": ["Question 1", "Question 2"],
  "quick_revision_points": ["Point 1", "Point 2"]
}
```

Also supported by the frontend mapper:
- `questions` or `exam_questions` instead of `important_questions`
- `revision_points` or `key_points` instead of `quick_revision_points`
- `result_summary` or `overview` instead of `summary`
- Wrapped payload inside `{ "data": { ... } }`

## Security Note
Do not expose your OpenAI API key in frontend JavaScript.
Keep it only on your Python backend.
