require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

const chatRoutes = require('./server/routes/chat');
const academicRoutes = require('./server/routes/academic');
const notesRoutes = require('./server/routes/notes');
const geminiService = require('./server/services/gemini');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure uploads folder (safe for both local filesystem and Vercel serverless /tmp)
const isVercel = Boolean(process.env.VERCEL);
const uploadsDir = isVercel
  ? path.join(os.tmpdir(), 'smart-campus-uploads')
  : path.join(__dirname, 'uploads');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn('[Server] Uploads directory note:', e.message);
}

// Global Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving (serves local static files when run directly via Node)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// API Routes - support both /api/* and direct mounts for Vercel serverless rewrites
app.use(['/api/chat', '/chat'], chatRoutes);
app.use(['/api/academic', '/academic'], academicRoutes);
app.use(['/api/notes', '/notes'], notesRoutes);

// Health check endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ONLINE',
    platform: isVercel ? 'Vercel Serverless' : 'Node.js Express',
    service: 'Smart Campus Student Portal API',
    geminiConfigured: geminiService.isApiKeyConfigured(),
    model: geminiService.getModelName(),
    timestamp: new Date().toISOString()
  });
});

// Single Page Application fallback - redirect non-API routes to index.html (for local node execution)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/chat') || req.path.startsWith('/academic') || req.path.startsWith('/notes')) {
    return next();
  }
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next();
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error Handler]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.code || 'SERVER_ERROR',
    message: err.message || 'Internal server error occurred.'
  });
});

// Start local HTTP server only when executed directly (not when required by Vercel serverless)
if (require.main === module) {
  app.listen(PORT, () => {
    const isKeySet = geminiService.isApiKeyConfigured();
    console.log(`
============================================================
🎓 SMART CAMPUS – AI-Powered College Student Portal
============================================================
🚀 Local Server:     http://localhost:${PORT}
🤖 Gemini AI Status: ${isKeySet ? 'CONNECTED (Key Configured)' : 'AWAITING KEY (Set GEMINI_API_KEY in .env)'}
🧠 Gemini Model:     ${geminiService.getModelName()}
📁 Uploads Dir:      ${uploadsDir}
☁️ Environment:      ${isVercel ? 'Vercel Production' : 'Local Development'}
============================================================
    `);
  });
}

module.exports = app;
