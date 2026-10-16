# CodeSaathi AI

> **From Notebook to Output.**

A complete, mobile-first web application that helps Indian school students photograph handwritten programming code from their notebooks, convert it to digital code using OCR, edit and compile it with a real compiler, and learn from an AI tutor — all personalized to their class, board, and experience level.

![CodeSaathi AI](https://img.shields.io/badge/CodeSaathi-AI-2563EB?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)

---

## ✨ Features

### 📸 Notebook Scanner
- Take photos of handwritten code from your notebook
- Multi-page support with reorder, crop, and rotate
- AI-powered handwriting OCR with confidence highlighting
- Review and correct extracted code before running

### ✏️ Code Editor
- Syntax highlighting with CodeMirror 6
- Mobile-friendly with on-screen symbol bar
- Auto-indent, bracket matching, undo/redo
- Support for Java (more languages extensible)

### ▶️ Real Compiler
- Genuine compilation and execution via Judge0 sandbox
- Supports standard input (Scanner programs)
- Real compiler errors with line numbers
- Execution time and memory tracking
- Safety limits: time, memory, output size

### 🤖 AI Tutor (OpenRouter)
- **Find My Mistakes**: AI identifies syntax, logic, and runtime errors
- **Explain My Program**: Multiple modes (Simple English, Hindi, Hinglish, Line-by-Line, Exam-style)
- **Compare View**: Side-by-side original vs corrected code
- Personalized to student's class, board, and experience level

### 📚 Learn Java
- Structured lessons: Variables, Operators, Conditions, Loops, Arrays, Strings, Methods
- Each lesson has explanation, code example, expected output, and practice question
- "Try It" button runs examples on the real compiler
- Progress tracking

### 👤 Student Profile
- 3-step setup: Name/Class → Board/Subject → Language/Level
- Adapts AI explanations to student's level
- Supports ICSE, CBSE, State Board
- Explanation languages: English, Hindi, Hinglish

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│          React PWA (Vite)           │
│   Tailwind CSS + CodeMirror 6      │
└──────────────┬──────────────────────┘
               │ REST API
┌──────────────▼──────────────────────┐
│       Express Backend (TS)          │
│  Auth │ Validation │ Rate Limiting  │
└──┬─────────┬──────────┬─────────┬──┘
   │         │          │         │
   ▼         ▼          ▼         ▼
Supabase  OpenRouter   Judge0   Storage
(DB+Auth)  (AI/OCR)  (Compiler) (Images)
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- A Supabase project ([supabase.com](https://supabase.com))
- An OpenRouter API key ([openrouter.ai](https://openrouter.ai))
- Judge0 instance ([judge0.com](https://judge0.com) or self-hosted via Docker)

### 1. Clone and Install

```bash
# Install all dependencies
npm run install:all
```

### 2. Configure Environment

```bash
# Copy the example env file
cp .env.example server/.env

# Edit server/.env with your actual keys
```

Create a `client/.env` file:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database

1. Go to your Supabase Dashboard → SQL Editor
2. Run the contents of `supabase/migrations/001_initial_schema.sql`
3. Create storage buckets:
   - `program-images` (private)
   - `curriculum-docs` (private)
4. Enable Google Auth in Authentication → Providers (optional)

### 4. Set Up Judge0

**Option A: Docker (Recommended for Development)**
```bash
docker-compose -f judge0-docker-compose.yml up -d
# Judge0 will be available at http://localhost:2358
```

**Option B: Hosted**
- Use [Judge0 CE](https://judge0.com/) or [RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce)
- Set `JUDGE0_URL` and `JUDGE0_API_KEY` in your `.env`

### 5. Run Development Servers

```bash
# Start both frontend and backend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Backend server port | No (default: 4000) |
| `FRONTEND_URL` | Frontend URL for CORS | No (default: http://localhost:5173) |
| `SUPABASE_URL` | Supabase project URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (backend only) | ✅ |
| `OPENROUTER_API_KEY` | OpenRouter API key | ✅ |
| `OPENROUTER_MODEL` | AI model for text tasks | No (default: google/gemini-2.0-flash-001) |
| `OPENROUTER_VISION_MODEL` | AI model for OCR/vision | No (default: google/gemini-2.0-flash-001) |
| `JUDGE0_URL` | Judge0 API URL | ✅ |
| `JUDGE0_API_KEY` | Judge0 API key | No (if self-hosted) |
| `MAX_IMAGE_MB` | Max image upload size | No (default: 5) |
| `MAX_PAGES` | Max pages per scan | No (default: 10) |
| `RUN_RATE_LIMIT_PER_MIN` | Code runs per minute per user | No (default: 10) |
| `AI_RATE_LIMIT_PER_MIN` | AI requests per minute per user | No (default: 10) |

### OpenRouter Setup
1. Create an account at [openrouter.ai](https://openrouter.ai)
2. Add credits to your account
3. Generate an API key
4. Choose a model that supports both text and vision (e.g., `google/gemini-2.0-flash-001`)
5. Set `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` in your `.env`

### OCR Configuration
OCR is performed using the OpenRouter vision model. The same API key is used.
- The vision model receives base64-encoded images and extracts code
- If you prefer a dedicated OCR service, modify `server/src/services/ocr.ts`
- Document your OCR provider choice in the config

---

## 📱 PWA Installation

Students can install CodeSaathi AI on their phones:
1. Open the app in Chrome on Android
2. Tap the "Add to Home Screen" banner
3. The app works like a native app with offline caching for static assets

---

## 🔒 Security

- All API keys are server-side only — never exposed to the browser
- Supabase Row Level Security (RLS) on every user table
- Students can only access their own data
- Code execution is sandboxed in Judge0 with CPU/memory/network limits
- Rate limiting on execution and AI endpoints
- Request validation with Zod schemas
- Helmet security headers
- CORS configured for frontend origin only
- Admin role cannot be self-assigned by students

---

## 🧪 Testing

```bash
# Run backend tests
cd server && npm test
```

### Manual Test Scenarios
1. ✅ Photo → OCR → Review → Edit → Run → Output
2. ✅ Multi-page program scan
3. ✅ Missing semicolon shows real compiler error
4. ✅ Scanner input program works
5. ✅ Hinglish explanation
6. ✅ Apply AI fix and run
7. ✅ Save and reopen program
8. ✅ Cross-user access denied
9. ✅ Missing API keys handled gracefully
10. ✅ Compiler timeout handled

---

## 📁 Project Structure

```
codesaathi-ai/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/          # Button, Card, Input, etc.
│   │   │   ├── layout/      # Layout, BottomNav, Sidebar
│   │   │   ├── scanner/     # Scanner flow components
│   │   │   ├── editor/      # Editor components
│   │   │   ├── ai/          # AI analysis/explanation
│   │   │   ├── programs/    # Program management
│   │   │   └── learn/       # Learning components
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API and Supabase
│   │   ├── stores/          # Zustand state stores
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utilities
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── server/                  # Express backend
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # AI, OCR, Execution
│   │   ├── middleware/      # Auth, validation
│   │   ├── db/              # Supabase client
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Error handling
│   └── package.json
├── supabase/
│   └── migrations/          # SQL schema + RLS
├── DESIGN.md                # Design system tokens
├── ARCHITECTURE.md          # Architecture docs
├── .env.example             # Env template
└── README.md
```

---

## 📄 License

This project is for educational purposes. See LICENSE for details.

---

<p align="center">
  <strong>CodeSaathi AI</strong> — From Notebook to Output. 📒→💻
</p>
