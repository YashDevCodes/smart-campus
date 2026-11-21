const express = require('express');
const router = express.Router();
const geminiService = require('../services/gemini');

/**
 * GET /api/chat/status
 * Returns current API configuration status and model info.
 */
router.get('/status', (req, res) => {
  const configured = geminiService.isApiKeyConfigured();
  const model = geminiService.getModelName();
  res.json({
    isConfigured: configured,
    model: model,
    status: configured ? 'READY' : 'AWAITING_API_KEY',
    message: configured 
      ? `Gemini AI is connected and ready using model ${model}`
      : 'GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in .env (local) or Vercel Environment Variables.'
  });
});

/**
 * GET /api/chat/prompts
 * Returns suggested prompt questions for quick selection.
 */
router.get('/prompts', (req, res) => {
  res.json({
    prompts: [
      {
        category: 'Today\'s Schedule',
        text: 'What classes do I have scheduled for today and where are they located?'
      },
      {
        category: 'Assignments',
        text: 'Which assignments are currently pending and what are their submission deadlines?'
      },
      {
        category: 'Conceptual Help',
        text: 'Can you explain the difference between AVL Tree and Red-Black Tree rotations?'
      },
      {
        category: 'Upcoming Events',
        text: 'Are there any upcoming hackathons or technical workshops on campus?'
      },
      {
        category: 'Study Planning',
        text: 'Help me create a prioritized 3-day study schedule for my Operating Systems assignments and exams.'
      },
      {
        category: 'Course Faculty',
        text: 'Who teaches Computer Networks and what is the room number?'
      }
    ]
  });
});

/**
 * POST /api/chat
 * Main chatbot query endpoint.
 * Accepts: { message: string, history: Array, studentContext: Object }
 */
router.post('/', async (req, res) => {
  const { message, history, studentContext } = req.body;

  // Validate presence of message
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: 'EMPTY_INPUT',
      message: 'Please provide a non-empty question or prompt.'
    });
  }

  try {
    const result = await geminiService.generateGeminiResponse(message, history, studentContext);
    return res.json({
      success: true,
      reply: result.reply,
      model: result.model,
      sdk: result.sdk,
      timestamp: result.timestamp
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: err.code || 'API_ERROR',
      message: err.message || 'An error occurred while generating a response from Gemini AI.',
      setupInstructions: err.setupInstructions || null
    });
  }
});

module.exports = router;
