/**
 * SMART CAMPUS – Class Timetable & Weekly Schedule Module
 * Displays full Mon-Sat weekly grid, interactive daily schedule view, current day detection,
 * and upcoming next-lecture countdown card.
 */

class TimetableModule {
  constructor() {
    this.container = document.getElementById('timetable-view');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    // If Sunday, default to Monday
    this.selectedDay = currentDay === 'Sunday' ? 'Monday' : currentDay;
    this.viewMode = 'daily'; // 'daily' | 'weekly'
  }

  init() {
    this.render();
  }

  render() {
    if (!this.container) return;
    const timetable = window.dataStore.getTimetable();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

    const nextLecture = this.calculateNextLecture();

    this.container.innerHTML = `
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--primary-navy);">
            <i class="fa-solid fa-calendar-days" style="color: var(--secondary-blue); margin-right: 0.5rem;"></i>
            Class Timetable & Lecture Schedule
          </h2>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;">
            Semester 3 (AIML-A) • Academic Year 2026-2027 • B.Tech CSE (AI/ML)
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <div class="tab-pill-group">
            <button class="tab-pill ${this.viewMode === 'daily' ? 'active' : ''}" onclick="window.timetableModule.switchView('daily')">
              <i class="fa-solid fa-calendar-day"></i> Daily View
            </button>
            <button class="tab-pill ${this.viewMode === 'weekly' ? 'active' : ''}" onclick="window.timetableModule.switchView('weekly')">
              <i class="fa-solid fa-calendar-week"></i> Full Week Grid
            </button>
          </div>
          <button class="btn btn-outline" onclick="window.timetableModule.askAiSchedule()">
            <i class="fa-solid fa-robot" style="color: var(--secondary-blue);"></i> Ask AI Schedule
          </button>
        </div>
      </div>

      <!-- Next Lecture Highlight Banner -->
      <div class="next-lecture-card">
        <div class="next-lecture-info">
          <span class="next-lecture-tag">
            <i class="fa-solid fa-bell"></i> ${nextLecture.statusTag}
          </span>
          <h4>${nextLecture.subject} (${nextLecture.code})</h4>
          <p style="font-size: 0.8125rem; opacity: 0.9;">
            <i class="fa-solid fa-clock"></i> ${nextLecture.time} &nbsp;•&nbsp; 
            <i class="fa-solid fa-location-dot"></i> Room: ${nextLecture.room} &nbsp;•&nbsp; 
            <i class="fa-solid fa-user-tie"></i> Faculty: ${nextLecture.faculty}
          </p>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.75rem; opacity: 0.85;">Current Day</span>
          <h3 style="font-size: 1.25rem; font-weight: 800;">${currentDayName}</h3>
        </div>
      </div>

      <!-- Controls: Day Selector Tabs (for Daily View) -->
      ${this.viewMode === 'daily' ? `
        <div class="timetable-header-controls">
          <div class="day-selector-tabs">
            ${days.map(d => {
              const isSelected = d === this.selectedDay;
              const isToday = d === currentDayName;
              return `
                <button 
                  class="day-tab-btn ${isSelected ? 'active' : ''} ${isToday ? 'today-indicator' : ''}"
                  onclick="window.timetableModule.selectDay('${d}')"
                >
                  ${d} ${isToday ? '(Today)' : ''}
                </button>
              `;
            }).join('')}
          </div>
          <div style="font-size: 0.8125rem; color: var(--text-muted); font-weight: 600;">
            Showing classes for <span style="color: var(--secondary-blue); font-weight: 700;">${this.selectedDay}</span>
          </div>
        </div>
      ` : ''}

      <!-- Main Schedule Display Container -->
      <div id="timetable-display-content">
        ${this.viewMode === 'daily' ? this.renderDailyView() : this.renderWeeklyView()}
      </div>
    `;
  }

  renderDailyView() {
    const timetable = window.dataStore.getTimetable();
    const daySchedule = timetable[this.selectedDay] || [];

    if (daySchedule.length === 0) {
      return `
        <div style="text-align: center; padding: 4rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <i class="fa-solid fa-mug-hot" style="font-size: 3rem; color: var(--accent-cyan); margin-bottom: 1rem;"></i>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--primary-navy); margin-bottom: 0.5rem;">
            No classes scheduled on ${this.selectedDay}
          </h3>
          <p style="font-size: 0.875rem; color: var(--text-muted);">
            Use this time for capstone projects, coding practice, or revising notes.
          </p>
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${daySchedule.map((slot, index) => {
          let typeColor = 'var(--secondary-blue)';
          let typeBg = '#EFF6FF';
          if (slot.type === 'Practical') {
            typeColor = '#059669';
            typeBg = '#ECFDF5';
          } else if (slot.type === 'Tutorial') {
            typeColor = '#D97706';
            typeBg = '#FFFBEB';
          } else if (slot.type === 'Activity' || slot.type === 'Workshop') {
            typeColor = '#7C3AED';
            typeBg = '#F5F3FF';
          }

          return `
            <div class="card" style="display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-left: 6px solid ${typeColor}; transition: transform var(--transition-fast);">
              <div style="display: flex; align-items: center; gap: 1.5rem;">
                <div style="width: 140px; font-weight: 800; font-size: 1rem; color: var(--primary-navy);">
                  ${slot.time}
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.25rem;">
                    <span style="font-size: 0.75rem; font-weight: 800; padding: 2px 8px; border-radius: var(--radius-pill); background: ${typeBg}; color: ${typeColor};">
                      ${slot.type}
                    </span>
                    <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">
                      ${slot.code}
                    </span>
                  </div>
                  <h3 style="font-size: 1.0625rem; font-weight: 700; color: var(--primary-navy);">
                    ${slot.subject}
                  </h3>
                  <div style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.25rem;">
                    <i class="fa-solid fa-location-dot" style="color: var(--secondary-blue);"></i> Room: <strong>${slot.room}</strong> &nbsp;•&nbsp; 
                    <i class="fa-solid fa-user-tie"></i> Faculty: <strong>${slot.faculty}</strong>
                  </div>
                </div>
              </div>

              <div>
                <button class="btn btn-sm btn-outline" onclick="window.timetableModule.askAiClassHelp('${slot.subject}', '${slot.room}')">
                  <i class="fa-solid fa-robot"></i> Syllabus & Viva
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderWeeklyView() {
    const timetable = window.dataStore.getTimetable();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return `
      <div class="timetable-table-container">
        <table class="timetable-table">
          <thead>
            <tr>
              <th style="width: 120px;">Day</th>
              <th>Period 1<br><span style="font-weight: normal; font-size: 0.6875rem;">09:00 - 10:00</span></th>
              <th>Period 2<br><span style="font-weight: normal; font-size: 0.6875rem;">10:00 - 11:00</span></th>
              <th>Period 3<br><span style="font-weight: normal; font-size: 0.6875rem;">11:15 - 12:15</span></th>
              <th>Period 4<br><span style="font-weight: normal; font-size: 0.6875rem;">12:15 - 01:15</span></th>
              <th>Afternoon Lab / Practical<br><span style="font-weight: normal; font-size: 0.6875rem;">02:00 - 04:00</span></th>
              <th>Period 6<br><span style="font-weight: normal; font-size: 0.6875rem;">04:00 - 05:00</span></th>
            </tr>
          </thead>
          <tbody>
            ${days.map(day => {
              const classes = timetable[day] || [];
              const c1 = classes[0];
              const c2 = classes[1];
              const c3 = classes[2];
              const c4 = classes[3];
              const c5 = classes[4];
              const c6 = classes[5];

              return `
                <tr>
                  <td style="font-weight: 800; color: var(--primary-navy); background: var(--bg-subtle);">
                    ${day}
                  </td>
                  <td>${this.formatCell(c1)}</td>
                  <td>${this.formatCell(c2)}</td>
                  <td>${this.formatCell(c3)}</td>
                  <td>${this.formatCell(c4)}</td>
                  <td style="background: rgba(27, 117, 187, 0.03);">${this.formatCell(c5)}</td>
                  <td>${this.formatCell(c6)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  formatCell(cls) {
    if (!cls) return `<span style="color: var(--text-light); font-size: 0.75rem;">—</span>`;
    return `
      <div style="font-size: 0.8125rem;">
        <div style="font-weight: 700; color: var(--primary-navy);">${cls.subject}</div>
        <div style="font-size: 0.6875rem; color: var(--text-muted);">${cls.code} • ${cls.room}</div>
      </div>
    `;
  }

  calculateNextLecture() {
    const todayInfo = window.dataStore.getTodayTimetable();
    const classes = todayInfo.classes;
    if (classes && classes.length > 0) {
      return {
        statusTag: 'Today\'s Next Class',
        subject: classes[0].subject,
        code: classes[0].code,
        time: classes[0].time,
        room: classes[0].room,
        faculty: classes[0].faculty
      };
    }
    return {
      statusTag: 'Next Scheduled Lecture',
      subject: 'Data Structures & Algorithms',
      code: 'CS301',
      time: '09:00 AM - 10:00 AM',
      room: 'LH-204',
      faculty: 'Dr. Rajesh Sharma'
    };
  }

  selectDay(day) {
    this.selectedDay = day;
    this.render();
  }

  switchView(mode) {
    this.viewMode = mode;
    this.render();
  }

  askAiSchedule() {
    const prompt = `What does my timetable look like for this entire week? Highlight any lab practicals, the faculty names, and classroom venues.`;
    window.chatbot.openWithPrompt(prompt);
  }

  askAiClassHelp(subject, room) {
    const prompt = `Tell me about my next class: "${subject}" in Room ${room}. What are the major topics covered, and what questions might the faculty ask during viva?`;
    window.chatbot.openWithPrompt(prompt);
  }
}

window.timetableModule = new TimetableModule();
