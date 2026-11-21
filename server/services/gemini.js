const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Official Google Gen AI SDK
let GoogleGenAI = null;
try {
  const genaiPkg = require('@google/genai');
  GoogleGenAI = genaiPkg.GoogleGenAI;
} catch (e) {
  console.error('[Gemini Service] Could not load @google/genai SDK:', e.message);
}

// Canonical Academic Data for grounding (required for Vercel NFT bundling)
let defaultAcademicData = null;
try {
  defaultAcademicData = require('../data/academicData.json');
} catch (e) {
  try {
    const dataPath = path.join(__dirname, '..', 'data', 'academicData.json');
    defaultAcademicData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  } catch (e2) {
    console.error('[Gemini Service] Could not load canonical academic data:', e2.message);
  }
}

// Tailored System Instruction for B.Tech / B.E. Engineering Students
const SYSTEM_INSTRUCTION_BASE = `You are Smart AI, the official AI academic assistant of Smart Campus – The Engineering Student Portal.

You help engineering students with:
1. Engineering assignments, lab programs, and coursework.
2. Subject-wise study materials, unit syllabus notes, and lab manuals.
3. Daily and weekly class, practical lab, and tutorial schedules.
4. Upcoming college hackathons, technical workshops, paper presentations, and tech fests.
5. Semester exam preparation, lab viva-voce questions, and study planning.
6. Programming (C++, Python, Java, SQL, Linux/POSIX), data structures, system design, and technical engineering concepts.
7. General academic, GATE prep, and engineering queries.

Give clear, friendly, accurate, and student-friendly answers.

Explain difficult engineering concepts in simple language with code examples, mathematical formulas, or step-by-step algorithmic logic whenever useful.

When students ask about their actual college assignments, timetable, notes, or events, use the information supplied by the website.

Never invent college-specific information. If the required information is unavailable, tell the student honestly.

You can also answer general educational, scientific, and engineering topics beyond the Smart Campus website.`;

/**
 * Checks whether a valid Gemini API key is configured in .env
 */
function isApiKeyConfigured() {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(
    key &&
    typeof key === 'string' &&
    key.trim() &&
    key !== 'your_gemini_api_key_here' &&
    !key.startsWith('your_') &&
    !key.startsWith('YOUR_')
  );
}

/**
 * Gets the configured model name from environment (defaults to ultra-fast gemini-3.1-flash-lite)
 */
function getModelName() {
  return process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
}

/**
 * Compiles real-time engineering academic context from portal data into a grounded reference string.
 */
function compileAcademicContext(liveData) {
  const data = liveData || defaultAcademicData;
  if (!data) return '';

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = daysOfWeek[new Date().getDay()];

  let context = `\n\n--- OFFICIAL SMART CAMPUS ENGINEERING PORTAL DATA (GROUND TRUTH) ---`;

  if (data.student) {
    context += `\nEngineering Student Profile:
- Name: ${data.student.name} (Roll: ${data.student.rollNo})
- Degree & Branch: ${data.student.program} - ${data.student.department} (Year ${data.student.year}, Semester ${data.student.semester}, Section ${data.student.section})
- College: ${data.student.college}
- Academic Performance: CGPA ${data.student.cgpa}/10.0, Attendance: ${data.student.attendance} (Minimum University Requirement: 75%)`;
  }

  if (data.subjects && Array.isArray(data.subjects)) {
    context += `\n\nEnrolled Engineering Courses & Faculty:`;
    data.subjects.forEach(s => {
      context += `\n- [${s.code}] ${s.name} (${s.shortName}) | Faculty: ${s.faculty} | Venue: ${s.room} | Credits: ${s.credits}`;
    });
  }

  if (data.timetable) {
    context += `\n\nClass & Practical Lab Timetable (Current Day: ${todayName}):`;
    if (data.timetable[todayName]) {
      context += `\nToday's Schedule (${todayName}):`;
      data.timetable[todayName].forEach(cls => {
        context += `\n  * ${cls.time}: ${cls.subject} (${cls.code}) in ${cls.room} with ${cls.faculty} [${cls.type}]`;
      });
    } else {
      context += `\nToday (${todayName}) has no regular lectures scheduled (Weekend / Holiday). Great for capstone projects and lab coding.`;
    }

    context += `\nWeekly Schedule Summary:`;
    for (const [day, classes] of Object.entries(data.timetable)) {
      context += `\n- ${day}: ` + classes.map(c => `${c.time.split(' ')[0]} ${c.code}`).join(', ');
    }
  }

  if (data.assignments && Array.isArray(data.assignments)) {
    context += `\n\nAssignments & Lab Submissions:`;
    data.assignments.forEach(a => {
      context += `\n- ID: ${a.id} | Subject: ${a.subject} (${a.code}) | Title: "${a.title}" | Due Date: ${a.dueDate} | Status: ${a.status} | Weightage: ${a.weightage}`;
      if (a.isApproaching && a.status === 'Pending') context += ` [URGENT DEADLINE APPROACHING]`;
      if (a.description) context += `\n  Description: ${a.description}`;
    });
  }

  if (data.notes && Array.isArray(data.notes)) {
    context += `\n\nAvailable Engineering Notes & Unit Syllabus:`;
    data.notes.forEach(n => {
      context += `\n- [${n.code}] ${n.title} (${n.unit}) - File: ${n.fileName} (Uploaded: ${n.uploadDate} by ${n.uploadedBy || 'Faculty'})`;
    });
  }

  if (data.events && Array.isArray(data.events)) {
    context += `\n\nEngineering Events, Hackathons & Seminars:`;
    data.events.forEach(e => {
      context += `\n- ${e.title} [${e.category}] on ${e.date} at ${e.time} (${e.venue}). Status: ${e.isUpcoming ? 'Upcoming' : 'Past'}`;
    });
  }

  if (data.announcements && Array.isArray(data.announcements)) {
    context += `\n\nOfficial College Notices:`;
    data.announcements.forEach(an => {
      context += `\n- [${an.date}][${an.priority} Priority] ${an.title}: ${an.content}`;
    });
  }

  context += `\n--- END OF PORTAL DATA ---\n`;
  return context;
}

/**
 * Formats multi-turn conversation history for @google/genai SDK
 */
function formatHistoryForGenAI(history) {
  if (!Array.isArray(history)) return [];
  const contents = [];

  // Limit past history to recent 6 turns for ultra-fast generation
  const recentHistory = history.slice(-6);

  for (const item of recentHistory) {
    if (!item.role || !item.content) continue;
    const role = (item.role === 'user' || item.role === 'student') ? 'user' : 'model';
    contents.push({
      role: role,
      parts: [{ text: String(item.content) }]
    });
  }

  return contents;
}

/**
 * Executes generateContent with strict timeout to prevent slow responses
 */
async function callGenAiWithTimeout(ai, modelName, contents, systemInstruction, timeoutMs = 8000) {
  return new Promise(async (resolve, reject) => {
    let timer = null;
    let completed = false;

    timer = setTimeout(() => {
      if (!completed) {
        completed = true;
        reject(new Error(`Timeout: Model "${modelName}" took longer than ${timeoutMs}ms`));
      }
    }, timeoutMs);

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.6,
          maxOutputTokens: 1500,
        }
      });
      if (!completed) {
        completed = true;
        clearTimeout(timer);
        resolve(response);
      }
    } catch (err) {
      if (!completed) {
        completed = true;
        clearTimeout(timer);
        reject(err);
      }
    }
  });
}

/**
 * Main service method: handles chat message with Gemini API.
 * Uses high-speed flash model first for 1-2s response times, with graceful fallbacks.
 */
async function generateGeminiResponse(userMessage, history = [], studentContext = null) {
  // Input validation
  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    throw {
      status: 400,
      code: 'EMPTY_INPUT',
      message: 'Please enter your engineering query or academic question.'
    };
  }

  const cleanMessage = userMessage.trim();
  if (cleanMessage.length > 4000) {
    throw {
      status: 400,
      code: 'INPUT_TOO_LONG',
      message: 'Question is too long. Please keep your question under 4000 characters.'
    };
  }

  if (!isApiKeyConfigured()) {
    throw {
      status: 503,
      code: 'API_KEY_NOT_CONFIGURED',
      message: 'Google Gemini API key is not configured yet. Please configure GEMINI_API_KEY in the server .env file or Vercel Environment Variables.',
      setupInstructions: '1. For Local: Add GEMINI_API_KEY in your .env file\n2. For Vercel: Go to Project Settings -> Environment Variables -> Add GEMINI_API_KEY\n3. Redeploy or restart the server.'
    };
  }

  if (!GoogleGenAI) {
    throw {
      status: 500,
      code: 'SDK_NOT_LOADED',
      message: 'The official @google/genai SDK is not loaded. Please run npm install.'
    };
  }

  const apiKey = process.env.GEMINI_API_KEY.trim();
  const configuredModel = getModelName();
  const groundTruthContext = compileAcademicContext(studentContext);
  const fullSystemInstruction = `${SYSTEM_INSTRUCTION_BASE}\n${groundTruthContext}`;

  const ai = new GoogleGenAI({ apiKey });

  // Prepare conversational history
  const pastContents = formatHistoryForGenAI(history);
  const contents = [
    ...pastContents,
    {
      role: 'user',
      parts: [{ text: cleanMessage }]
    }
  ];

  // Ultra-fast model prioritization:
  // If user explicitly configured a model, try it first with a quick 8s timeout.
  // If that model is gemini-3.8-flash (which often experiences 503 high demand),
  // or if it times out, immediately fall back to gemini-3.1-flash-lite (1-2s latency).
  const modelsToTry = [];
  if (configuredModel && configuredModel !== 'gemini-3.8-flash') {
    modelsToTry.push(configuredModel);
  }
  // High-speed flash models
  if (!modelsToTry.includes('gemini-3.1-flash-lite')) modelsToTry.push('gemini-3.1-flash-lite');
  if (!modelsToTry.includes('gemini-3.5-flash-lite')) modelsToTry.push('gemini-3.5-flash-lite');
  if (!modelsToTry.includes('gemini-3.5-flash')) modelsToTry.push('gemini-3.5-flash');
  if (configuredModel === 'gemini-3.8-flash') modelsToTry.push('gemini-3.8-flash');

  let lastError = null;

  for (const modelToAttempt of modelsToTry) {
    try {
      const response = await callGenAiWithTimeout(ai, modelToAttempt, contents, fullSystemInstruction, 7000);

      const replyText = response.text || (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text);
      if (replyText) {
        return {
          reply: replyText,
          model: modelToAttempt,
          sdk: '@google/genai',
          timestamp: new Date().toISOString()
        };
      }
    } catch (err) {
      const errStr = String(err.message || err);
      console.warn(`[Gemini Speed Handler] Model "${modelToAttempt}" did not finish in time or threw error: ${errStr}. Trying next fast model...`);
      lastError = err;

      // Stop fallback only if explicit auth/permission/safety error
      if (errStr.includes('API_KEY_INVALID') || errStr.includes('API key not valid') || errStr.includes('PERMISSION_DENIED')) {
        throw handleGenAiError(err, modelToAttempt);
      }
      if (errStr.includes('SAFETY') || errStr.includes('blocked')) {
        throw handleGenAiError(err, modelToAttempt);
      }
    }
  }

  // If all quick attempts timed out or failed, try one last time with gemini-3.1-flash-lite with standard call
  try {
    const finalResp = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: contents,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.6
      }
    });
    if (finalResp.text) {
      return {
        reply: finalResp.text,
        model: 'gemini-3.1-flash-lite',
        sdk: '@google/genai',
        timestamp: new Date().toISOString()
      };
    }
  } catch (e) {
    lastError = e;
  }

  throw handleGenAiError(lastError, configuredModel);
}

/**
 * Translates Gemini API errors into clean student-friendly messages
 */
function handleGenAiError(err, modelName) {
  const errMsg = err?.message || String(err || '');
  console.error('[Gemini Service Error]:', errMsg);

  if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid')) {
    return {
      status: 401,
      code: 'INVALID_API_KEY',
      message: 'The configured Google Gemini API key is invalid or has expired. Please verify your GEMINI_API_KEY in the .env file.'
    };
  }

  if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('429')) {
    return {
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Gemini API quota or rate limit exceeded. Please wait a brief moment before sending another question.'
    };
  }

  if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
    return {
      status: 503,
      code: 'MODEL_HIGH_DEMAND',
      message: 'Gemini AI servers are temporarily experiencing high demand. Please try asking again in a few seconds.'
    };
  }

  if (errMsg.includes('SAFETY') || errMsg.includes('blocked')) {
    return {
      status: 400,
      code: 'CONTENT_FLAGGED',
      message: 'This question could not be answered because it triggered Gemini AI content safety filters.'
    };
  }

  return {
    status: 500,
    code: 'GEMINI_API_ERROR',
    message: 'An error occurred while communicating with Google Gemini API. Please try again.'
  };
}

module.exports = {
  generateGeminiResponse,
  isApiKeyConfigured,
  getModelName,
  compileAcademicContext,
  SYSTEM_INSTRUCTION_BASE
};
