/**
 * SMART CAMPUS – Data Management & LocalStorage Sync Layer
 * Manages all client state, assignment statuses, event RSVPs, study notes, and chat history.
 */

const STORAGE_KEYS = {
  PORTAL_DATA: 'smart_campus_portal_data_v1',
  CHAT_HISTORY: 'smart_campus_chat_history_v1',
  THEME: 'smart_campus_theme'
};

class DataStore {
  constructor() {
    this.data = null;
    this.listeners = [];
  }

  /**
   * Initializes store by loading from localStorage or fetching from server.
   */
  async init() {
    const cached = localStorage.getItem(STORAGE_KEYS.PORTAL_DATA);
    if (cached) {
      try {
        this.data = JSON.parse(cached);
        console.log('[DataStore] Loaded from localStorage.');
        return this.data;
      } catch (e) {
        console.warn('[DataStore] Failed to parse cached data, fetching from server...');
      }
    }

    return await this.fetchFromServer();
  }

  /**
   * Fetches the canonical academic dataset from the Express backend.
   */
  async fetchFromServer() {
    try {
      const response = await fetch('/api/academic/data');
      if (!response.ok) throw new Error('Network error loading academic data');
      const json = await response.json();
      this.data = json;
      this.persist();
      console.log('[DataStore] Fetched fresh data from server.');
      return this.data;
    } catch (err) {
      console.error('[DataStore] Server fetch failed:', err);
      // Fallback in-memory minimal structure
      this.data = this.getDefaultFallbackData();
      return this.data;
    }
  }

  /**
   * Persists current state to localStorage.
   */
  persist() {
    if (this.data) {
      localStorage.setItem(STORAGE_KEYS.PORTAL_DATA, JSON.stringify(this.data));
      this.notifyListeners();
    }
  }

  /**
   * Subscribes a callback to data changes.
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  notifyListeners() {
    this.listeners.forEach(cb => {
      try { cb(this.data); } catch (e) { console.error('Listener callback error:', e); }
    });
  }

  // ==================== GETTERS ====================

  getStudent() {
    return this.data?.student || {
      name: 'Yash Sharma',
      rollNo: '23CSAI042',
      department: 'Computer Science & Engineering (AI & ML)',
      program: 'B.Tech CSE (AI/ML)',
      semester: 3,
      year: 2,
      college: 'Apex Institute of Technology & Engineering'
    };
  }

  getSubjects() {
    return this.data?.subjects || [];
  }

  getTimetable() {
    return this.data?.timetable || {};
  }

  getTodayTimetable() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    // For demo purposes on weekends, fallback to Monday schedule if weekend has no lectures
    const schedule = this.data?.timetable?.[currentDay] || [];
    return {
      day: currentDay,
      classes: schedule.length > 0 ? schedule : (this.data?.timetable?.['Monday'] || []),
      isWeekendDemo: schedule.length === 0
    };
  }

  getAssignments() {
    return this.data?.assignments || [];
  }

  getNotes() {
    return this.data?.notes || [];
  }

  getEvents() {
    return this.data?.events || [];
  }

  getAnnouncements() {
    return this.data?.announcements || [];
  }

  // ==================== MUTATORS ====================

  /**
   * Updates an assignment's status (Pending, Submitted, Overdue)
   */
  updateAssignmentStatus(id, newStatus) {
    if (!this.data || !this.data.assignments) return false;
    const assignment = this.data.assignments.find(a => a.id === id);
    if (assignment) {
      assignment.status = newStatus;
      if (newStatus === 'Submitted') {
        assignment.submittedDate = new Date().toISOString().split('T')[0];
        assignment.isApproaching = false;
      }
      this.persist();
      return true;
    }
    return false;
  }

  /**
   * Adds a new assignment to the store.
   */
  addAssignment(assignment) {
    if (!this.data) return false;
    if (!this.data.assignments) this.data.assignments = [];
    
    const newRecord = {
      id: `ASG-${Date.now().toString().slice(-4)}`,
      assignedDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      isApproaching: false,
      ...assignment
    };
    
    this.data.assignments.unshift(newRecord);
    this.persist();
    return newRecord;
  }

  /**
   * Adds a newly uploaded or created study note.
   */
  addNote(note) {
    if (!this.data) return false;
    if (!this.data.notes) this.data.notes = [];
    this.data.notes.unshift(note);
    this.persist();
    return note;
  }

  /**
   * Toggles student RSVP / Interested state for an event.
   */
  toggleEventRSVP(eventId) {
    if (!this.data || !this.data.events) return false;
    const event = this.data.events.find(e => e.id === eventId);
    if (event) {
      event.registered = !event.registered;
      this.persist();
      return event.registered;
    }
    return false;
  }

  /**
   * Resets demo data back to default server database.
   */
  async resetDemoData() {
    localStorage.removeItem(STORAGE_KEYS.PORTAL_DATA);
    return await this.fetchFromServer();
  }

  // ==================== CHAT HISTORY ====================

  getChatHistory() {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  saveChatHistory(history) {
    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(history));
  }

  clearChatHistory() {
    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
  }

  /**
   * Provides current grounded snapshot for passing to Gemini API.
   */
  getGroundingContext() {
    return {
      student: this.getStudent(),
      timetable: this.getTimetable(),
      assignments: this.getAssignments(),
      notes: this.getNotes(),
      events: this.getEvents(),
      announcements: this.getAnnouncements(),
      subjects: this.getSubjects()
    };
  }

  getDefaultFallbackData() {
    return {
      student: { name: 'Yash Sharma', rollNo: '23CSAI042', department: 'CSE (AI/ML)', semester: 3 },
      subjects: [],
      timetable: {},
      assignments: [],
      notes: [],
      events: [],
      announcements: []
    };
  }
}

// Global instance
window.dataStore = new DataStore();
