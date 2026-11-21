const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Direct require guarantees Vercel's NFT (Node File Trace) includes the JSON in the serverless bundle
let canonicalData = null;
try {
  canonicalData = require('../data/academicData.json');
} catch (e) {
  try {
    const dataPath = path.join(__dirname, '..', 'data', 'academicData.json');
    canonicalData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  } catch (e2) {
    console.error('[Academic Route] Error reading academicData.json:', e2.message);
  }
}

function loadAcademicData() {
  if (canonicalData) return canonicalData;
  try {
    const dataPath = path.join(__dirname, '..', 'data', 'academicData.json');
    return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  } catch (e) {
    return null;
  }
}

/**
 * GET /api/academic/data or /academic/data
 * Returns the full student portal database.
 */
router.get('/data', (req, res) => {
  const data = loadAcademicData();
  if (!data) {
    return res.status(500).json({ error: 'Could not load academic data' });
  }
  res.json(data);
});

/**
 * GET /api/academic/timetable
 */
router.get('/timetable', (req, res) => {
  const data = loadAcademicData();
  res.json(data ? data.timetable : {});
});

/**
 * GET /api/academic/assignments
 */
router.get('/assignments', (req, res) => {
  const data = loadAcademicData();
  res.json(data ? data.assignments : []);
});

/**
 * GET /api/academic/notes
 */
router.get('/notes', (req, res) => {
  const data = loadAcademicData();
  res.json(data ? data.notes : []);
});

/**
 * GET /api/academic/events
 */
router.get('/events', (req, res) => {
  const data = loadAcademicData();
  res.json(data ? data.events : []);
});

/**
 * GET /api/academic/announcements
 */
router.get('/announcements', (req, res) => {
  const data = loadAcademicData();
  res.json(data ? data.announcements : []);
});

module.exports = router;
