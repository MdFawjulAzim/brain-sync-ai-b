# BrainSync AI - Development Log

## 📌 Project Overview

**Project Name:** BrainSync AI  
**Description:** A real-time, AI-powered knowledge base and "Second Brain" application.  
**Tech Stack:** React (Vite), Node.js (Express), PostgreSQL, Prisma, Socket.io, Google Gemini AI, OpenAI.

---

## 📅 Date: December 16, 2025 (Phase 1: Core Backend)

### 🎯 Goal

Complete the Authentication system, implement the Notes CRUD module with relational data, and integrate Google Gemini AI for automatic note summarization.

### 🏗️ Tasks & Progress

- [x] **Refactored Architecture:** Removed the Service layer in favor of a "Fat Controller" pattern to simplify development.
- [x] **Global Error Handling:** Implemented a centralized error handler ensuring consistent JSON responses (Zod & Prisma errors).
- [x] **User Authentication:**
  - Implemented Registration with Bcrypt password hashing.
  - Implemented Login with JWT generation.
  - Created `auth` middleware to protect routes.
- [x] **Notes Module (CRUD):**
  - **Create:** Used Prisma `connectOrCreate` to handle Tags dynamically.
  - **Read:** Implemented pagination logic using `skip/take`.
  - **Update/Delete:** Added ownership checks to ensure users can only modify their own notes.
- [x] **AI Integration (Basic):** Integrated Google Gemini API to summarize note content.
- [x] **Socket.io Setup:** Merged Socket logic into `server.ts` to fix connection issues.

### 🐛 Challenges Faced & Fixes

**1. Zod Version Compatibility (TS2724)**

- **Problem:** Encountered error `'"zod"' has no exported member named 'AnyZodObject'` because we are using Zod v3.24+.
- **Fix:** Replaced `AnyZodObject` with **`ZodSchema`** in `validateRequest.ts`. This provides a more universal type definition for validation.

**2. Invalid Token Format in Auth Middleware**

- **Problem:** JWT verification failed with "invalid token" even when the token was correct.
- **Root Cause:** The `Authorization` header contained the prefix `"Bearer "`, which confused the `jwt.verify` function.
- **Fix:** Updated `auth.ts` to check for the "Bearer " prefix and split the string to extract the actual token before verification.

**3. TypeScript `req.user` Property**

- **Problem:** TypeScript threw an error because `user` does not exist on the default Express `Request` type.
- **Fix:** Created a type declaration file `src/types/express.d.ts` to extend the `Request` interface and include the `user` property.

**4. Google Gemini AI Model 404 Error**

- **Problem:** Requests to `gemini-1.5-flash` and `gemini-pro` failed with `[404 Not Found] ... model is not found for API version v1beta`.
- **Root Cause:** Google frequently updates model names, and availability depends on the specific API Key permissions.
- **Fix:** Created a standalone script (`list_models.js`) to fetch the available models for the specific API Key directly from Google. Identified that **`gemini-2.5-flash`** was available (initially) and updated the controller.

**5. Socket.io Connection Error (404)**

- **Issue:** Postman failed to connect to `ws://localhost:5000` with a `404 Not Found` error.
- **Root Cause:** The `package.json` dev script was running `src/index.ts` (which didn't have Socket logic), but the Socket.io configuration was in `src/server.ts`.
- **Fix:** Merged logic into `src/server.ts`, updated `package.json` script, and deleted the redundant `src/index.ts`.

---

## 📅 Date: December 17, 2025 (Phase 2: RAG Implementation)

### 🎯 Goal

Implement **Retrieval Augmented Generation (RAG)** to allow users to "Chat with their Notes". This involves storing vector embeddings of note content and using semantic search to retrieve relevant context for the AI.

### 🏗️ Tasks & Progress

- [x] **Database Upgrade (Vector Support):**
  - Enabled `postgresqlExtensions` in Prisma Schema.
  - Added `embedding` column with type `Unsupported("vector(768)")` to the `Note` model.
  - Migrated from local PostgreSQL to **Dockerized PostgreSQL** (`pgvector/pgvector:pg16`) to support vector operations.
- [x] **Backend Architecture for RAG:**
  - **Utils:** Created `src/utils/ai.ts` to handle Google Gemini Embedding (`text-embedding-004`) and Chat generation.
  - **Write Operations:** Updated `createNote` and `updateNote` controllers to generate and save embeddings using **Prisma Raw SQL**.
  - **Read Operations:** Created `ai.controller.ts` to handle vector similarity search using the cosine distance operator (`<=>`).
- [x] **API Endpoints:**
  - Added `POST /api/v1/notes/chat` endpoint for the chat interface.

### 🐛 Challenges Faced & Fixes

**6. Postgres Vector Extension Unavailable**

- **Problem:** Migration failed with `ERROR: extension "vector" is not available`.
- **Root Cause:** Standard local PostgreSQL installations do not include the `pgvector` extension by default.
- **Fix:** Switched database infrastructure to **Docker**. Used the official `pgvector/pgvector:pg16` image to spin up a containerized database with vector support pre-installed.

**7. Database Connection & Port Conflicts**

- **Problem:** `Prisma Studio` and Server failed to connect with `password authentication failed`.
- **Root Cause:** The local Windows PostgreSQL service was running on port `5432`, blocking the Docker container. Also, `.env` credentials didn't match the Docker config.
- **Fix:** Stopped the local PostgreSQL service (`services.msc`), updated `.env` to match Docker credentials, and re-ran migrations.

**8. API Key Leak & Security Block**

- **Problem:** AI Request failed with `[403 Forbidden] Your API key was reported as leaked`.
- **Root Cause:** Google automatically detected the API Key in a public repository or insecure environment and revoked it.
- **Fix:** Generated a fresh API Key from Google AI Studio, updated `.env`, and ensured `.env` is listed in `.gitignore`.

**9. Prisma Raw SQL Table Naming (Case Sensitivity)**

- **Problem:** Vector update failed with `Raw query failed. Code: 42P01. Message: relation "notes" does not exist`.
- **Root Cause:** We used `UPDATE notes` in the raw SQL query, but Prisma generated the table as `"Note"` (PascalCase) because we didn't use `@@map("notes")` in the schema. In PostgreSQL, unquoted names are lowercased, but quoted names preserve case.
- **Fix:** Updated all Raw SQL queries to use double quotes for the table name: `UPDATE "Note" ...` and `FROM "Note" ...`.

**10. Gemini Model Availability (Rate Limits)**

- **Problem:** Chat requests failed with `[429 Too Many Requests] ... limit: 0, model: gemini-2.5-pro`.
- **Root Cause:** We attempted to use `gemini-2.5-pro` (which is either restricted or non-existent for the free tier).
- **Fix:** Switched the Chat Model to **`gemini-1.5-flash`**, which offers a generous free tier (15 RPM) and faster response times suitable for real-time chat.

---

## 📅 Date: December 19, 2025 (Phase 3: AI Quiz & Active Recall)

### 🎯 Goal

Implement an **Active Recall System** where users can generate quizzes from their notes using **OpenAI (GPT-3.5)** with a **Gemini Fallback**, take tests, and discuss their mistakes with an AI Tutor.

### 🏗️ Tasks & Progress

- [x] **OpenAI Integration (with Fallback):**
  - Configured `openai` package with strict Type Safety in `env.ts`.
  - Implemented a **Gemini Fallback System**: If OpenAI fails (e.g., billing quota exceeded), the system automatically switches to Google Gemini to ensure uninterrupted service.
- [x] **Database Schema Update (Prisma):**

  - Added `Quiz` model (stores score, total questions).
  - Added `Question` model (stores options, correct answer, user's answer).
  - Established One-to-Many relations between `User`, `Quiz`, and `Question`.

- [x] **Quiz Logic Implementation:**

  - **Generate Quiz:** Fetches note content -> Sends prompt to OpenAI (or Gemini) -> Parses JSON -> Saves to DB.
  - **Submit Answer:** Server-side validation of answers to prevent cheating -> Updates Score and `isCorrect` status in DB.
  - **Mistake Analysis Chat:** Feeds the full quiz context (User's wrong answers vs Correct answers) to AI -> Explains _why_ the user was wrong.

- [x] **API Endpoints:**
  - `POST /api/v1/quiz/generate` (Generate from specific note or latest notes)
  - `POST /api/v1/quiz/submit` (Calculate score)
  - `POST /api/v1/quiz/chat` (Tutor chat)

### 🐛 Challenges & Fixes (Backend)

**11. OpenAI Response Parsing**

- **Problem:** AI sometimes returns text before the JSON object, causing `JSON.parse` to fail.
- **Fix:** Used OpenAI's **JSON Mode** (`response_format: { type: "json_object" }`) to ensure the output is always strictly valid JSON.

**12. Hardcoded Model Names**

- **Problem:** Changing from `gpt-3.5-turbo` to `gpt-4o` required changing code in multiple files.
- **Fix:** Refactored code to export `GPT_MODEL` constant from `src/utils/openai.ts`. Now changing the model requires only one line update.

**13. Environment Variable Validation**

- **Problem:** App crashed at runtime if API Key was missing.
- **Fix:** Updated `src/config/env.ts` using Zod to make `OPENAI_API_KEY` required (`z.string()`) instead of optional.

**14. Gemini JSON Parsing Error (Markdown Backticks)**

- **Problem:** When switching to the Gemini fallback (due to OpenAI rate limits), `JSON.parse` failed.
- **Root Cause:** Gemini tries to be helpful by wrapping the JSON output in Markdown code blocks (e.g., `json { ... } `), which is invalid for direct parsing.
- **Fix:** Implemented a regex cleaner ` .replace(/```json|```/g, "").trim() ` to strip Markdown formatting before parsing the JSON string.

---

### 📊 Current Tech Stack (Updated)

| Feature                   | Technology                                         |
| :------------------------ | :------------------------------------------------- |
| **Core API**              | Express.js + TypeScript                            |
| **Database**              | PostgreSQL (Docker + pgvector)                     |
| **ORM**                   | Prisma v7                                          |
| **RAG / Chat with Notes** | **Google Gemini** (`gemini-1.5-flash`)             |
| **Quiz / Active Recall**  | **OpenAI** (`gpt-3.5-turbo`) + **Gemini Fallback** |
| **Real-time**             | Socket.io                                          |
