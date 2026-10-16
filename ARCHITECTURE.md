# CodeSaathi AI — Architecture Document

## Overview

CodeSaathi AI is a mobile-first progressive web application (PWA) built for Indian school students. It enables them to photograph handwritten programming code, digitize it via OCR, compile and execute it in a secure sandbox, and learn from an AI tutor personalized to their educational context.

## Design Decisions

### 1. Monorepo Structure
We use a simple monorepo with `/client` and `/server` directories rather than a monorepo tool (Turborepo, Nx) to keep the setup simple for educational contributors. Both projects are independently buildable.

### 2. OCR via Vision Model (not dedicated OCR)
Instead of using a dedicated OCR service like Google Vision or Tesseract, we use a vision-capable LLM through OpenRouter. This provides:
- Better understanding of programming syntax and context
- Ability to infer uncertain characters based on code context
- Structured output with confidence scores
- Single API integration for both OCR and AI features

**Trade-off**: Slightly higher latency and cost per image vs. dedicated OCR. Can be swapped by modifying `server/src/services/ocr.ts`.

### 3. CodeMirror 6 (not Monaco)
We chose CodeMirror 6 for the editor because:
- Much better mobile/touch support than Monaco
- Smaller bundle size (~100KB vs ~2MB)
- Designed for embedding in web apps
- Works well on low-end Android devices

Monaco is optionally lazy-loaded for desktop users who want richer IntelliSense.

### 4. Judge0 for Code Execution
Judge0 provides battle-tested sandboxed code execution with:
- Language-specific compilers (Java, Python, C++, etc.)
- Configurable resource limits (CPU, memory, output)
- Network isolation
- Automatic cleanup

**We NEVER execute student code on the application server.**

### 5. Supabase (not custom auth/DB)
Supabase provides auth, PostgreSQL, storage, and RLS in one service:
- Row Level Security ensures data isolation at the database level
- Built-in email + Google OAuth
- Signed URLs for private file storage
- Real-time capabilities if needed later

### 6. Zustand (not Redux)
Zustand is used for client state management because:
- Minimal boilerplate
- Works naturally with React hooks
- Tiny bundle size (~1KB)
- Simple learning curve for contributors

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      CLIENT (React PWA)                       │
│                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Scanner  │  │  Editor  │  │ Programs │  │    Learn     │  │
│  │  (Camera, │  │(CodeMirr │  │  (CRUD,  │  │  (Lessons,   │  │
│  │  OCR Rev) │  │  or 6)   │  │  Search) │  │  Progress)   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│       │              │              │               │          │
│  ┌────▼──────────────▼──────────────▼───────────────▼──────┐  │
│  │                   Zustand Stores                        │  │
│  │  authStore │ editorStore │ scannerStore │ programStore   │  │
│  └─────────────────────┬───────────────────────────────────┘  │
│                        │                                       │
│  ┌─────────────────────▼───────────────────────────────────┐  │
│  │                  API Service (axios)                     │  │
│  │    Auto-attaches auth token, handles errors              │  │
│  └─────────────────────┬───────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────────┘
                         │ HTTPS / REST
┌────────────────────────▼──────────────────────────────────────┐
│                    SERVER (Express + TS)                       │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                    Middleware                           │   │
│  │  helmet │ cors │ rate-limit │ auth │ validate(zod)     │   │
│  └────────┬───────────────────────────────────────────────┘   │
│           │                                                    │
│  ┌────────▼───────────────────────────────────────────────┐   │
│  │                     Routes                             │   │
│  │  /auth │ /profile │ /programs │ /execute │ /ai │ /ocr  │   │
│  │  /lessons │ /admin                                     │   │
│  └────┬──────────┬────────────────┬──────────┬────────────┘   │
│       │          │                │          │                  │
│  ┌────▼────┐ ┌───▼─────┐  ┌──────▼────┐ ┌───▼────────┐       │
│  │ AI Svc  │ │ OCR Svc │  │ Exec Svc  │ │  DB (Supa) │       │
│  │OpenRoute│ │(Vision) │  │ (Judge0)  │ │ + Storage  │       │
│  └────┬────┘ └───┬─────┘  └──────┬────┘ └───┬────────┘       │
└───────┼──────────┼───────────────┼───────────┼────────────────┘
        │          │               │           │
        ▼          ▼               ▼           ▼
   OpenRouter   OpenRouter      Judge0     Supabase
   (Text AI)    (Vision AI)    (Sandbox)   (PG + Auth
                                            + Storage)
```

## Data Flow

### Scan → Edit → Run Flow
```
1. Student captures photo(s) on phone
2. Client compresses images (max 1600px, ~1MB)
3. Client uploads to POST /api/ocr/process (multipart)
4. Server converts images to base64
5. Server sends each image to OpenRouter Vision model
6. Vision model extracts code with confidence scores
7. Server combines pages, returns OCRResult
8. Client shows extracted code with uncertain lines highlighted
9. Student reviews, edits, confirms code
10. Student presses Run
11. Client sends code + input to POST /api/execute
12. Server validates, sends to Judge0 with limits
13. Judge0 compiles + runs in sandbox
14. Server returns output/errors
15. Client displays result
```

### AI Analysis Flow
```
1. Student presses "Find My Mistakes"
2. Client sends code + compiler output to POST /api/ai/analyze
3. Server loads student profile for context
4. Server builds personalized system prompt
5. Server calls OpenRouter with code analysis request
6. AI returns structured issues array
7. Server validates response, saves to ai_results
8. Client displays issues with Apply Fix buttons
```

## Database Schema

```
profiles ──── 1:1 ──── auth.users
    │
    ├── programs ──── 1:N ──── program_images
    │       │
    │       ├──── 1:N ──── execution_records
    │       │
    │       └──── 1:N ──── ai_results
    │
    └── learning_progress ──── N:1 ──── lessons

user_roles ──── N:1 ──── auth.users

curriculum_documents (admin-managed)
```

All user tables have Row Level Security (RLS) policies ensuring students can only access their own data.

## Security Model

| Layer | Protection |
|-------|-----------|
| Frontend | No secrets, no direct DB access |
| API | Helmet headers, CORS, rate limiting |
| Auth | Supabase JWT tokens, middleware verification |
| Data | RLS policies on every table |
| Storage | Private buckets, signed URLs |
| Execution | Judge0 sandbox: no network, limited CPU/memory |
| AI | Server-side only, no key exposure |

## Extensibility

### Adding a New Programming Language
1. Add language to `LANGUAGE_MAP` in `server/src/services/execution.ts`
2. Add CodeMirror language extension in `client/src/pages/CodeEditor.tsx`
3. Add to language selector UI
4. Add seed lessons for the new language

### Switching OCR Provider
1. Modify `server/src/services/ocr.ts`
2. Implement the same `OCRResult` interface
3. Update `OCR_PROVIDER` and `OCR_API_KEY` env vars

### Adding RAG for Curriculum
1. Upload curriculum documents via admin panel
2. Documents are stored in Supabase Storage
3. Extract text and create embeddings (using OpenRouter or a local model)
4. Store in a `curriculum_chunks` table with vector column
5. Query relevant chunks when answering curriculum-specific questions

## Performance Targets

| Metric | Target |
|--------|--------|
| First Load (4G) | < 3 seconds |
| JS Bundle (gzipped) | < 200 KB initial |
| Image Compression | Max 1600px, ~1MB |
| Code Editor Load | Lazy, < 500ms |
| OCR Processing | < 10s per page |
| Code Execution | < 5s timeout |
| AI Response | < 15s timeout |
