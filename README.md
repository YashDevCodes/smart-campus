# 🎓 SMART CAMPUS – AI-Powered College Student Portal
> **Your College, Your Academics, Your AI Assistant**  
> Developed for **Prompt Engineering Laboratory Final Project**  
> **Program:** B.Tech Computer Science & Engineering (AI / ML) — 2nd Year, 3rd Semester  

---

## 📌 Executive Summary

**SMART CAMPUS** is a modern, responsive, full-stack university student web portal designed to eliminate academic fragmentation. Instead of juggling WhatsApp class groups, disparate Google Drive folders, notice boards, and unstructured PDF notes, students have a unified digital hub.

The centerpiece of the portal is **Smart AI** — an academic generative AI assistant powered by **Google's official Gemini API SDK**. Smart AI is grounded in real-time portal data (daily schedule, assignments, syllabus units, hackathons, and announcements), delivering context-aware, hallucination-free academic support alongside deep conceptual explanations.

---

## 🌟 Key Modules & Features

### 1. 📊 Interactive Dashboard
- **Personalized Welcome Experience:** Salutation with dynamic student profile (`Yash Sharma`, Roll `23CSAI042`, AIML-A).
- **Academic KPI Stat Cards:** Total pending assignments, upcoming campus events, today's lecture count, and live attendance / CGPA monitor.
- **Today's Class Schedule:** Real-time day detection highlighting the current and next upcoming lecture.
- **Official Campus Notices:** High, medium, and informative circulars ticker.
- **Weekly Academic Activity:** Visualized credit hour workload across Monday through Saturday.
- **Quick-Access Navigation:** One-click shortcuts to all portal modules.

### 2. 📝 Assignments Section
- **Subject-Wise Categorization:** Data Structures & Algorithms, Operating Systems, Computer Networks, Discrete Mathematics, and Prompt Engineering.
- **Status Filtering:** Tabbed filtering across **All**, **Pending**, **Submitted**, and **Overdue**.
- **Deadline Urgency Badges:** Visual red indicators for tasks due in less than 48 hours.
- **Interactive State Changes:** Mark assignments as submitted or reopen pending tasks with instant **localStorage** persistence.
- **Search & Filter:** Real-time search across titles, descriptions, and subject tags.
- **Custom Assignment Creation:** Modal form with validation to add personal study assignments.
- **"Ask AI" Integration:** One-click button to request step-by-step guidance on any assignment.

### 3. 📚 Notes & Study Materials Section
- **Organized by Subject & Unit:** Syllabus-aligned study modules (Unit 1 through Unit 4).
- **PDF Previews & Downloads:** Access 9 genuine, verified downloadable course PDF notes.
- **Direct File Uploads:** Upload `.pdf`, `.docx`, `.pptx`, or `.txt` materials through a backend Express endpoint (`multer`), immediately saving to `uploads/` and updating portal state.
- **Interactive View Modal:** Inspect syllabus outlines, file size, upload timestamp, and faculty details.

### 4. 🎪 Events & Announcements Section
- **Upcoming vs. Past Activities:** Distinct tabs for Hackathons (e.g., *HackAI 2026*), technical workshops, guest lectures, and programming contests.
- **Interactive RSVP / Register Toggle:** Persisted registration tracking with confirmation notifications.
- **Official Notice Board:** Controller of Examinations notices, lab manual submission timetables, and library hour circulars.
- **Category Filter & Search:** Filter by Hackathon, Workshop, Seminar, Competition, or Exhibition.

### 5. 📅 Class Timetable & Weekly Schedule
- **Complete Mon–Sat Schedule:** 9:00 AM to 5:00 PM lecture, practical lab, and tutorial timetable.
- **Dual View Modes:**
  - **Daily Schedule View:** Interactive day-selector with "Today" indicator badge.
  - **Full Week Grid View:** Clean, responsive matrix of all 6 days.
- **Next Lecture Banner:** Highlights upcoming room number, subject, and faculty.

### 6. 🤖 Smart AI Assistant (Gemini API Integration)
- **Official Google Gen AI SDK Integration:** Powered by `@google/genai` and `@google/generative-ai`.
- **Dual Interface Design:**
  - **Floating AI Action Button (FAB):** Expandable bottom-right chat widget with pulse animation.
  - **Dedicated Full-Page AI View:** Split-screen layout featuring suggested questions, context grounding status, and extended conversation pane.
- **Context Grounding (Prompt Engineering):** Dynamically injects student's schedule, deadlines, and syllabus into the system instructions.
- **Conversational Memory:** Preserves multi-turn conversation history during the session.
- **Markdown & Code Rendering:** Beautiful formatting for code snippets, bullet points, and tables.
- **Resilient Error Handling:** Graceful fallback and clear setup instructions if API key is unconfigured, rate-limited, or invalid.
- **Suggested Question Chips:** Instant 1-click prompts for common student questions.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+ Modules), Font Awesome 6, Google Fonts (Plus Jakarta Sans) |
| **Backend Server** | Node.js (v20+), Express.js (v4.21) |
| **AI SDK** | Google Gen AI Official SDK (`@google/genai` & `@google/generative-ai`) |
| **File Handling** | Multer (Multipart Form Uploads) |
| **Data Persistence** | Browser `localStorage` (Client) + Canonical JSON Datastore (Server) |
| **Security** | `dotenv` environment variable isolation (API keys never exposed to client) |

---

## 📁 Project Structure

```
smart-campus/
│
├── public/                     # Frontend Assets & Client JavaScript
│   ├── index.html              # Main Single Page Application structure
│   ├── css/
│   │   └── style.css           # Complete responsive CSS design system
│   ├── js/
│   │   ├── app.js              # Router, global navigation, notifications, clock
│   │   ├── data.js             # Central data store with localStorage sync
│   │   ├── dashboard.js        # Dashboard metrics, schedules, weekly chart
│   │   ├── assignments.js      # Assignment status, filters, add modal
│   │   ├── notes.js            # Notes grid, upload handler, PDF preview modal
│   │   ├── events.js           # Events feed, RSVP toggle, notice board
│   │   ├── timetable.js        # Mon-Sat timetable, daily & weekly views
│   │   └── chatbot.js          # Smart AI widget & dedicated view controller
│   └── assets/
│       └── sample-notes/       # 9 Downloadable sample curriculum PDF notes
│
├── server/                     # Backend Logic & REST APIs
│   ├── data/
│   │   └── academicData.json   # Canonical academic seed data (B.Tech 3rd Sem)
│   ├── routes/
│   │   ├── chat.js             # POST /api/chat, GET /api/chat/status
│   │   ├── academic.js         # GET /api/academic/data, /timetable, etc.
│   │   └── notes.js            # POST /api/notes/upload (Multer handler)
│   └── services/
│       └── gemini.js           # Google Gen AI integration with context injection
│
├── uploads/                    # Directory for student-uploaded study materials
├── .env.example                # Configuration template
├── .env                        # Local environment file (API keys)
├── .gitignore                  # Git ignore rules for node_modules & credentials
├── package.json                # Project dependencies and npm scripts
├── server.js                   # Main Express application entrypoint
├── PROMPTS.md                  # Prompt engineering documentation & iterations
└── README.md                   # Full project documentation (this file)
```

---

## 🚀 Installation & Local Execution

### Prerequisites
- **Node.js** (v18 or higher recommended; verified on Node v26)
- **npm** (v9 or higher)
- A **Google Gemini API Key** (obtain free from [Google AI Studio](https://aistudio.google.com/))

### Step 1: Clone or Navigate to the Project
```bash
cd smart-campus
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and insert your Gemini API Key:
```env
PORT=3000
GEMINI_API_KEY=AIzaSyYourActualKeyHere
GEMINI_MODEL=gemini-2.5-flash
```

> **Note:** If you run the portal before entering an API key, the portal UI remains 100% functional. The AI chatbot will display an informative guidance card explaining how to configure your key.

### Step 4: Start the Application
```bash
# Production mode
npm start

# Development mode with hot-reloading
npm run dev
```

### Step 5: Open in Your Web Browser
Navigate to:
```
http://localhost:3000
```

---

## 🧠 Prompt Engineering Implementation

The core intelligence of **Smart AI** is guided by prompt engineering techniques documented in `PROMPTS.md`:

1. **System Persona Steering:** Formulated with clear boundary conditions, student-friendly tone, and academic authority.
2. **Context-Grounded RAG (Retrieval-Augmented Generation):** Before querying Gemini, the backend dynamically synthesizes the student's exact timetable, pending assignments, overdue tasks, and campus notices.
3. **Anti-Hallucination Guardrail:** Explicit instructions prohibit inventing dates, room numbers, or deadlines. If unlisted in portal data, the assistant politely declines and points to the official college department.
4. **Multi-Turn Conversational Memory:** Maintains recent message context for natural follow-up queries.

---

## 🌐 Deployment Instructions

## 🌐 Vercel Production Deployment Guide

The SMART CAMPUS portal is 100% serverless-ready and configured for instant Vercel deployment with dedicated `vercel.json` and `api/index.js` routing.

### Architecture on Vercel:
- **Static Assets:** Served directly via Vercel Global Edge CDN from the `public/` folder (`/`, `/css/*`, `/js/*`, `/assets/*`).
- **Serverless API Routes:** Requests to `/api/*` are handled by the Express Serverless Function at `api/index.js`.
- **AI Engine:** Securely queries Google Gemini API using server-side environment variables with no frontend key exposure.

---

### Method A: Deploy via GitHub & Vercel Dashboard (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Configure Vercel serverless deployment"
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```

2. **Import into Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/) and click **"Add New..." -> "Project"**.
   - Select your GitHub repository.
   - **Framework Preset:** Select **Other** (Vercel automatically detects `vercel.json`).
   - **Root Directory:** `./`

3. **Configure Environment Variables in Vercel:**
   Expand the **Environment Variables** section and add:
   - `GEMINI_API_KEY` = `your_google_ai_studio_api_key`
   - `GEMINI_MODEL` = `gemini-3.1-flash-lite`

4. **Deploy:**
   - Click **Deploy**. Vercel will build and assign you a live production URL (e.g., `https://smart-campus-xxx.vercel.app`).

---

### Method B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Preview:**
   ```bash
   vercel
   ```
   Follow the interactive prompts:
   - *Set up and deploy?* -> `Y`
   - *Which scope?* -> Select your account
   - *Link to existing project?* -> `N`
   - *Project name?* -> `smart-campus`
   - *In which directory is your code located?* -> `./`

3. **Add Secrets via CLI & Deploy to Production:**
   ```bash
   vercel env add GEMINI_API_KEY
   vercel env add GEMINI_MODEL
   vercel --prod
   ```

---

### Verified Google AI Models for Vercel:

| Model ID | Latency | Status on Vercel | Recommendation |
|---|---|---|---|
| `gemini-3.1-flash-lite` | **~1.2s - 1.7s** | ✅ **Verified Active** | **Best for Production** (Ultra-fast, lowest latency) |
| `gemini-3.5-flash-lite` | **~850ms** | ✅ **Verified Active** | Ultra-lightweight fallback |
| `gemini-3.5-flash` | **~8.8s** | ✅ **Verified Active** | Standard multimodal reasoning |
| `gemini-3.8-flash` | **~15s+** | ⚠️ High Demand Spikes | May encounter temporary 503 during peak traffic |

---

## 👨‍🎓 Project Credits & Academic Context
- **Course:** Prompt Engineering Laboratory (B.Tech CSE - AI/ML)
- **Semester:** 3rd Semester, 2nd Year
- **Student Name:** Yash Sharma (Roll: 23CSAI042)
- **Institution:** Apex Institute of Technology & Engineering (Demonstration)
