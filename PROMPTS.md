# 📝 PROMPTS.md – Prompt Engineering Laboratory Documentation
## Project: SMART CAMPUS – AI-Powered College Student Portal
**Course:** Prompt Engineering Laboratory Final Project  
**Program:** B.Tech Computer Science & Engineering (AI/ML), 2nd Year, 3rd Semester  
**Student:** Yash Sharma | Roll No: 23CSAI042  

---

## 1. Laboratory Objectives & Problem Statement

In academic student portals, conversational AI systems face three critical failure modes:
1. **Hallucination of High-Stakes Institutional Facts:** Inventing lecture room numbers, assignment deadlines, or faculty names.
2. **Context Blindness:** Inability to know what the current student is enrolled in, which assignments they have already submitted, or what classes are scheduled today.
3. **Overly Verbose or Robotic Tone:** Providing generic textbook dumps rather than concise, student-friendly academic assistance.

The primary objective of this laboratory project was to iteratively engineer, test, and benchmark the system instruction and prompt architecture for **Smart AI**, transforming an ungrounded LLM into a reliable academic assistant.

---

## 2. Iteration 1: Baseline Naive Prompt (Initial Experiment)

### The Prompt:
```text
You are a helpful college assistant. Help students with their college questions, homework, assignments, and class schedules. Be polite and helpful.
```

### Observed Shortcomings & Vulnerabilities:
- ❌ **Severe Hallucinations:** When asked *"When is my Operating Systems assignment due?"*, the model fabricated dates (e.g., *"Your OS assignment is due on October 15th"*).
- ❌ **Room & Faculty Fabrications:** Invented nonexistent professors and lecture rooms.
- ❌ **No Concept of Real-Time Data:** Could not know what day of the week it was or which assignments the student had already submitted.
- ❌ **Lack of Boundaries:** Readily answered completely unrelated off-topic queries without guiding students back to their academic goals.

---

## 3. Iteration 2: Persona Steering & Negative Guardrails

To address hallucinations, we applied **Persona Steering** and explicit **Negative Constraints**.

### The Improved Prompt:
```text
You are Smart AI, the official academic assistant of Smart Campus. Your purpose is to help college students with their academic activities. You can assist with assignments, study materials, class schedules, events, programming concepts, exam preparation, and general educational questions.

Be friendly, clear, accurate, and student-friendly. Keep explanations easy to understand.

CRITICAL INSTRUCTION: Never invent college-specific information such as deadlines, classroom numbers, faculty details, or event dates. If the required information is unavailable in the provided college data, clearly inform the student. You may also help with general educational topics beyond the college portal.
```

### Outcomes & Analysis:
- ✅ **Hallucination Elimination:** The model stopped inventing deadlines and room numbers.
- ⚠️ **New Limitation (Over-Refusal):** Because the model lacked access to the actual portal database, it responded to legitimate student questions (e.g., *"What is my next class?"*) with: *"I do not have access to your schedule."*
- 💡 **Engineering Insight:** Guardrails without grounded data turn the assistant into a disclaimer engine. To make it genuinely useful, real-time portal context must be injected.

---

## 4. Iteration 3: Dynamic In-Context Grounding (RAG-Style Injection)

In this phase, we architected a backend context serialization pipeline in `server/services/gemini.js` that compiles the student's live portal data into a structured context block appended to the system instruction.

### Grounding Pipeline Architecture:
```
[Client Portal State]
  ├── Today's Timetable & Room Numbers
  ├── Weekly Schedule (Mon-Sat)
  ├── Pending & Approaching Assignments
  ├── Available Unit Notes & Syllabus
  └── Campus Notices & Events
         │
         ▼
[compileAcademicContext() Function]
         │
         ▼
[System Instruction + Ground Truth Payload]
         │
         ▼
[Google Gemini API (@google/genai SDK)]
```

### Context Formatting Structure:
```text
--- OFFICIAL SMART CAMPUS PORTAL DATA (GROUND TRUTH) ---
Student Profile:
- Name: Yash Sharma (Roll: 23CSAI042)
- Department: Computer Science & Engineering (AI & ML) (Year 2, Semester 3)
- CGPA: 9.12, Attendance: 89.4%

Enrolled Subjects & Faculty:
- [CS301] Data Structures & Algorithms (DSA) | Faculty: Dr. Rajesh Sharma | Room: LH-204
- [CS302] Computer Networks (CN) | Faculty: Prof. Ananya Roy | Room: LH-102
- [CS303] Operating Systems (OS) | Faculty: Dr. Vikram Malhotra | Room: CS-Lab 2
- [CS304] Discrete Mathematics (DM) | Faculty: Prof. S. K. Gupta | Room: LH-301
- [AI301] Prompt Engineering & Generative AI | Faculty: Dr. Neha Verma | Room: AI-Lab

Class Timetable (Current Day: Monday):
  * 09:00 - 10:00: Data Structures & Algorithms (CS301) in LH-204 with Dr. Rajesh Sharma [Lecture]
  * 10:00 - 11:00: Operating Systems (CS303) in CS-Lab 2 with Dr. Vikram Malhotra [Lecture]
  ...

Assignments & Status:
- ID: ASG-001 | Subject: Data Structures & Algorithms (CS301) | Title: "Red-Black Tree & AVL Tree Implementation in C++" | Due Date: 2026-11-23 | Status: Pending [DEADLINE APPROACHING]
...
--- END OF PORTAL DATA ---
```

---

## 5. Iteration 4: Multi-Turn Conversation Memory & Output Formatting

To support multi-turn tutoring (e.g., student asking *"Can you explain the rotations for that assignment?"* followed by *"Give me a code example in C++"*), we implemented chat session history formatting.

### Technique Used:
- Formats past turns into `{ role: 'user' | 'model', parts: [{ text }] }`.
- Context Window Management: Limits conversational history to the last 8 turns to prevent token bloat while retaining immediate context.
- System Directive for Formatting: Instructs Gemini to format code blocks with language identifiers (````cpp ... ````) and utilize clean bulleted lists for readability.

---

## 6. Verification & Test Scenarios

The prompt engineering implementation was evaluated across 5 key scenario categories:

| Scenario | Student Query | Expected Behavior | Actual Gemini System Result |
|---|---|---|---|
| **Schedule Retrieval** | *"What class do I have next and where is it?"* | Look up current day timetable and cite exact room and faculty. | Cites room (e.g. `LH-204`) and faculty (`Dr. Rajesh Sharma`) from grounded data. |
| **Urgent Deadlines** | *"Do I have any assignments due soon?"* | Identify `ASG-001` (Red-Black Trees) due in 24-48 hours. | Accurately identifies `ASG-001` with due date and urgency badge. |
| **Anti-Hallucination** | *"What is the phone number of the dean?"* | Information not in portal data; decline politely. | Politely informs the student that dean contact numbers are not in the portal database. |
| **Academic Tutoring** | *"Explain AVL Tree LL rotation."* | Provide conceptual explanation with diagrammatic ASCII or steps. | Provides step-by-step rotation logic with Big-O complexity ($O(\log n)$). |
| **Campus Life** | *"Tell me about upcoming hackathons."* | Summarize *HackAI 2026* with prize pool and venue. | Accurately details *HackAI 2026* (Nov 28, ₹2.5L prize pool). |

---

## 7. Laboratory Conclusion

By combining **System Persona Steering**, **Negative Anti-Hallucination Directives**, and **Dynamic Grounding Injection**, the SMART CAMPUS assistant achieves:
1. **Zero institutional hallucinations** on course timetables and assignment deadlines.
2. **Context-aware academic responses** that mirror real college operations.
3. **Robust production reliability** suitable for formal academic demonstration and evaluation.
