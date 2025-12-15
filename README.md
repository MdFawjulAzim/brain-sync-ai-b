Here is the updated documentation based on everything we accomplished today. I have organized it chronologically, highlighting the specific errors encountered and how we fixed them.

---

# BrainSync AI - Development Log

## 📌 Project Overview

**Project Name:** BrainSync AI
**Description:** A real-time, AI-powered knowledge base and "Second Brain" application.
**Tech Stack:** React (Vite), Node.js (Express), PostgreSQL, Prisma, Socket.io, Google Gemini AI.

---

## 📅 Date: December 16, 2025

### 🎯 Daily Goal

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
- [x] **AI Integration:** Integrated Google Gemini API to summarize note content.
- [x] **Documentation:** Updated `README.md` and API logs.

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
- **Fix:** Created a standalone script (`list_models.js`) to fetch the available models for the specific API Key directly from Google. Identified that **`gemini-2.5-flash`** was available and updated the controller to use it.

### 💡 Key Learnings

- **Architecture:** Simplifying the stack by removing the Service layer accelerates development for small-to-medium APIs.
- **Prisma:** The `connectOrCreate` method is powerful for handling Many-to-Many relationships (like Tags) in a single query.
- **Debugging:** When dealing with external APIs (like Google AI), creating small, standalone scripts (`.js`) to test connectivity is faster than debugging the entire Express app.
- **Zod:** Using `z.coerce.number()` makes handling Query Parameters (which are strings by default) much easier for pagination.
