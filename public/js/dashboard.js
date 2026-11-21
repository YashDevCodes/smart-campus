/**
 * SMART CAMPUS – Dashboard Module
 * Renders student overview, key metrics, today's schedule, announcements, and weekly activity chart.
 */

class DashboardModule {
  constructor() {
    this.container = document.getElementById('dashboard-view');
  }

  init() {
    this.render();
    // Re-render when data updates (e.g., assignment marked submitted)
    window.dataStore.subscribe(() => {
      this.updateMetrics();
      this.renderTodaySchedule();
    });
  }

  render() {
    if (!this.container) return;
    const student = window.dataStore.getStudent();
    const assignments = window.dataStore.getAssignments();
    const events = window.dataStore.getEvents();
    const todayInfo = window.dataStore.getTodayTimetable();
    const announcements = window.dataStore.getAnnouncements();

    const pendingAssignments = assignments.filter(a => a.status === 'Pending');
    const urgentAssignments = pendingAssignments.filter(a => a.isApproaching);
    const upcomingEvents = events.filter(e => e.isUpcoming);

    this.container.innerHTML = `
      <!-- Welcome Hero Banner -->
      <section class="welcome-banner">
        <div class="welcome-content">
          <div class="welcome-badge">
            <i class="fa-solid fa-graduation-cap"></i>
            <span>${student.department} • Semester ${student.semester}</span>
          </div>
          <h2>Welcome back, ${student.name.split(' ')[0]}! 👋</h2>
          <p>
            You have <strong style="color: var(--accent-cyan);">${pendingAssignments.length} pending assignments</strong> 
            (${urgentAssignments.length > 0 ? urgentAssignments.length + ' urgent' : 'none overdue'}) 
            and <strong>${todayInfo.classes.length} classes</strong> scheduled for ${todayInfo.day}.
          </p>
          <div class="welcome-actions">
            <button class="btn btn-accent" onclick="window.appRouter.navigateTo('assignments')">
              <i class="fa-solid fa-list-check"></i> View Assignments
            </button>
            <button class="btn btn-outline-white" onclick="window.chatbot.toggleFloatingChat()">
              <i class="fa-solid fa-robot"></i> Ask Smart AI
            </button>
            <button class="btn btn-outline-white" onclick="window.appRouter.navigateTo('timetable')">
              <i class="fa-solid fa-calendar-days"></i> View Timetable
            </button>
          </div>
        </div>
      </section>

      <!-- Stat Metrics Grid -->
      <section class="stats-grid">
        <div class="stat-card" onclick="window.appRouter.navigateTo('assignments')">
          <div class="stat-icon-wrapper amber">
            <i class="fa-solid fa-hourglass-half"></i>
          </div>
          <div class="stat-meta">
            <h3 id="stat-pending-count">${pendingAssignments.length}</h3>
            <p>Pending Assignments</p>
            <span class="stat-badge ${urgentAssignments.length > 0 ? 'urgent' : 'good'}">
              ${urgentAssignments.length > 0 ? `${urgentAssignments.length} Due Soon` : 'All On Track'}
            </span>
          </div>
        </div>

        <div class="stat-card" onclick="window.appRouter.navigateTo('events')">
          <div class="stat-icon-wrapper blue">
            <i class="fa-solid fa-calendar-star"></i>
          </div>
          <div class="stat-meta">
            <h3>${upcomingEvents.length}</h3>
            <p>Upcoming Events</p>
            <span class="stat-badge neutral">Hackathons & Seminars</span>
          </div>
        </div>

        <div class="stat-card" onclick="window.appRouter.navigateTo('timetable')">
          <div class="stat-icon-wrapper emerald">
            <i class="fa-solid fa-chalkboard-user"></i>
          </div>
          <div class="stat-meta">
            <h3>${todayInfo.classes.length}</h3>
            <p>Today's Lectures</p>
            <span class="stat-badge good">${todayInfo.day} Schedule</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper purple">
            <i class="fa-solid fa-chart-line"></i>
          </div>
          <div class="stat-meta">
            <h3>${student.attendance || '89.4%'}</h3>
            <p>Current Attendance</p>
            <span class="stat-badge good">CGPA: ${student.cgpa || '9.12'}</span>
          </div>
        </div>
      </section>

      <!-- Quick Access Cards Navigation -->
      <section class="quick-access-section">
        <div class="section-title">
          <span>Quick Campus Portals</span>
          <span style="font-size: 0.8125rem; font-weight: normal; color: var(--text-muted);">Instant module shortcuts</span>
        </div>
        <div class="quick-cards-grid">
          <div class="quick-card" onclick="window.appRouter.navigateTo('notes')">
            <div class="quick-card-icon" style="background: #EFF6FF; color: var(--secondary-blue);">
              <i class="fa-solid fa-book-open"></i>
            </div>
            <h4>Notes & Materials</h4>
            <span>Browse unit PDFs & slides</span>
          </div>

          <div class="quick-card" onclick="window.appRouter.navigateTo('assignments')">
            <div class="quick-card-icon" style="background: #FFFBEB; color: var(--warning);">
              <i class="fa-solid fa-clipboard-check"></i>
            </div>
            <h4>Assignments</h4>
            <span>Track & submit coursework</span>
          </div>

          <div class="quick-card" onclick="window.appRouter.navigateTo('timetable')">
            <div class="quick-card-icon" style="background: #ECFDF5; color: var(--success);">
              <i class="fa-solid fa-table-cells"></i>
            </div>
            <h4>Class Timetable</h4>
            <span>Weekly Mon-Sat schedule</span>
          </div>

          <div class="quick-card" onclick="window.appRouter.navigateTo('events')">
            <div class="quick-card-icon" style="background: #FDF2F8; color: #DB2777;">
              <i class="fa-solid fa-bullhorn"></i>
            </div>
            <h4>Events & Notices</h4>
            <span>Hackathons & circulars</span>
          </div>

          <div class="quick-card" onclick="window.appRouter.navigateTo('ai-assistant')">
            <div class="quick-card-icon" style="background: #F0FDF4; color: #16A34A;">
              <i class="fa-solid fa-brain"></i>
            </div>
            <h4>Smart AI Assistant</h4>
            <span>Instant academic tutor</span>
          </div>
        </div>
      </section>

      <!-- Two-Column Main Grid: Today's Schedule & Announcements -->
      <section class="dashboard-grid">
        <!-- Left: Today's Schedule -->
        <div class="card">
          <div class="card-header">
            <h3><i class="fa-solid fa-clock"></i> Today's Schedule (${todayInfo.day})</h3>
            <button class="btn btn-outline btn-sm" onclick="window.appRouter.navigateTo('timetable')">
              Full Timetable <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
          <div class="schedule-list" id="dashboard-schedule-list">
            ${this.getScheduleListHtml(todayInfo.classes)}
          </div>
        </div>

        <!-- Right: Important Academic Announcements -->
        <div class="card">
          <div class="card-header">
            <h3><i class="fa-solid fa-bell"></i> Official Notices</h3>
            <span class="badge" style="font-size: 0.75rem; color: var(--secondary-blue); font-weight: 600;">Latest Circulars</span>
          </div>
          <div class="notice-list">
            ${this.getAnnouncementsHtml(announcements.slice(0, 3))}
          </div>
          <div style="margin-top: 1rem; text-align: center;">
            <button class="btn btn-outline btn-sm" style="width: 100%;" onclick="window.appRouter.navigateTo('events')">
              View Notice Board <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </section>

      <!-- Weekly Overview / Study Analytics -->
      <section class="card" style="margin-bottom: 2rem;">
        <div class="card-header">
          <div>
            <h3><i class="fa-solid fa-chart-simple"></i> Weekly Academic Load & Activity</h3>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
              Scheduled lecture hours and laboratory workload across the current week.
            </p>
          </div>
          <span class="status-badge" style="background: #EFF6FF; color: var(--secondary-blue);">
            32 Total Weekly Credit Hours
          </span>
        </div>
        ${this.getWeeklyActivityChartHtml()}
      </section>
    `;
  }

  getScheduleListHtml(classes) {
    if (!classes || classes.length === 0) {
      return `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <i class="fa-solid fa-mug-hot" style="font-size: 2rem; margin-bottom: 0.5rem; color: var(--accent-cyan);"></i>
          <p>No regular classes scheduled for today. Great day for self-study and assignments!</p>
        </div>
      `;
    }

    return classes.map((item, idx) => {
      const isLecture = item.type === 'Lecture';
      const isLab = item.type === 'Practical';
      const isTutorial = item.type === 'Tutorial';
      
      let badgeStyle = 'background: #EFF6FF; color: #1E40AF;';
      if (isLab) badgeStyle = 'background: #ECFDF5; color: #065F46;';
      if (isTutorial) badgeStyle = 'background: #FFFBEB; color: #92400E;';

      return `
        <div class="schedule-item ${idx === 0 ? 'active-class' : ''}">
          <div class="schedule-left">
            <span class="schedule-time">${item.time}</span>
            <span class="schedule-subject">${item.subject} (${item.code})</span>
            <span class="schedule-details">
              <i class="fa-solid fa-location-dot" style="color: var(--secondary-blue);"></i> ${item.room} &nbsp;•&nbsp; 
              <i class="fa-solid fa-user-tie"></i> ${item.faculty}
            </span>
          </div>
          <div>
            <span class="schedule-badge" style="${badgeStyle}">
              ${item.type}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  getAnnouncementsHtml(notices) {
    if (!notices || notices.length === 0) {
      return `<p style="color: var(--text-muted);">No new announcements today.</p>`;
    }

    return notices.map(n => {
      const priClass = n.priority === 'High' ? 'priority-high' : (n.priority === 'Medium' ? 'priority-medium' : 'priority-low');
      return `
        <div class="notice-item" onclick="window.appRouter.navigateTo('events')">
          <div class="notice-header-row">
            <span class="notice-priority ${priClass}">${n.priority} Priority</span>
            <span class="notice-meta"><i class="fa-regular fa-calendar"></i> ${n.date}</span>
          </div>
          <div class="notice-title">${n.title}</div>
          <div class="notice-meta">Issued by: ${n.author}</div>
        </div>
      `;
    }).join('');
  }

  getWeeklyActivityChartHtml() {
    const timetable = window.dataStore.getTimetable();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

    const dayLoads = days.map(day => {
      const classes = timetable[day] || [];
      const totalHours = classes.length; // Approximate 1 hour per item
      return {
        day: day.slice(0, 3),
        fullDay: day,
        hours: totalHours,
        isCurrent: day === currentDayName
      };
    });

    const maxHours = 7;

    return `
      <div class="weekly-activity-bar">
        ${dayLoads.map(d => {
          const percentage = Math.min(100, Math.round((d.hours / maxHours) * 100));
          return `
            <div class="day-bar-col">
              <span style="font-size: 0.6875rem; font-weight: 700; color: ${d.isCurrent ? 'var(--secondary-blue)' : 'var(--text-muted)'};">
                ${d.hours} hrs
              </span>
              <div class="bar-fill-container" title="${d.fullDay}: ${d.hours} hours of classes">
                <div class="bar-fill ${d.isCurrent ? 'active' : ''}" style="height: ${percentage}%;"></div>
              </div>
              <span class="day-label ${d.isCurrent ? 'active' : ''}">${d.day}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  updateMetrics() {
    const assignments = window.dataStore.getAssignments();
    const pending = assignments.filter(a => a.status === 'Pending').length;
    const el = document.getElementById('stat-pending-count');
    if (el) el.textContent = pending;
  }

  renderTodaySchedule() {
    const todayInfo = window.dataStore.getTodayTimetable();
    const listEl = document.getElementById('dashboard-schedule-list');
    if (listEl) {
      listEl.innerHTML = this.getScheduleListHtml(todayInfo.classes);
    }
  }
}

window.dashboardModule = new DashboardModule();
