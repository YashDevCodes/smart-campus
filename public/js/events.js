/**
 * SMART CAMPUS – Events & Announcements Module
 * Displays upcoming and past campus activities (hackathons, workshops, seminars, competitions),
 * RSVP/interested toggle, category filtering, search, and official notice board.
 */

class EventsModule {
  constructor() {
    this.container = document.getElementById('events-view');
    this.activeTab = 'upcoming'; // 'upcoming' | 'past'
    this.selectedCategory = 'All';
    this.searchQuery = '';
  }

  init() {
    this.render();
    window.dataStore.subscribe(() => {
      this.renderEventsFeed();
    });
  }

  render() {
    if (!this.container) return;
    const announcements = window.dataStore.getAnnouncements();

    this.container.innerHTML = `
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--primary-navy);">
            <i class="fa-solid fa-bullhorn" style="color: var(--secondary-blue); margin-right: 0.5rem;"></i>
            Campus Events, Hackathons & Official Notices
          </h2>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;">
            Explore hackathons, workshops, technical seminars, and official college announcements.
          </p>
        </div>
        <button class="btn btn-outline" onclick="window.eventsModule.askAiEvents()">
          <i class="fa-solid fa-robot" style="color: var(--secondary-blue);"></i> Ask AI About Hackathons
        </button>
      </div>

      <!-- Main Layout: Events Feed (Left) & Notice Board (Right) -->
      <div class="events-container">
        <!-- Left: Events Feed -->
        <div>
          <!-- Filter & Tab Toolbar -->
          <div class="filter-toolbar">
            <!-- Search Box -->
            <div class="search-box">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input 
                type="text" 
                class="search-input" 
                id="events-search-input" 
                placeholder="Search events, workshops, hackathons..."
                oninput="window.eventsModule.handleSearch(this.value)"
              >
            </div>

            <!-- Upcoming vs Past Tabs -->
            <div class="tab-pill-group">
              <button class="tab-pill active" onclick="window.eventsModule.setTab('upcoming', this)">Upcoming</button>
              <button class="tab-pill" onclick="window.eventsModule.setTab('past', this)">Past Events</button>
            </div>

            <!-- Category Select -->
            <div class="filter-group">
              <label style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted);">Type:</label>
              <select class="filter-select" id="events-category-select" onchange="window.eventsModule.handleCategoryFilter(this.value)">
                <option value="All">All Categories</option>
                <option value="Hackathon">Hackathons</option>
                <option value="Workshop">Workshops</option>
                <option value="Seminar">Seminars</option>
                <option value="Competition">Competitions</option>
                <option value="Exhibition">Exhibitions</option>
              </select>
            </div>
          </div>

          <!-- Events Feed List -->
          <div class="events-feed" id="events-feed-container">
            <!-- Injected by renderEventsFeed() -->
          </div>
        </div>

        <!-- Right: Official Notice Board -->
        <div>
          <div class="notice-board-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color);">
              <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--primary-navy); display: flex; align-items: center; gap: 0.5rem;">
                <i class="fa-solid fa-clipboard-list" style="color: var(--secondary-blue);"></i> Official Notice Board
              </h3>
              <span class="status-badge" style="background: #EFF6FF; color: var(--secondary-blue);">
                ${announcements.length} Notices
              </span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${this.getFullAnnouncementsHtml(announcements)}
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderEventsFeed();
  }

  renderEventsFeed() {
    const feed = document.getElementById('events-feed-container');
    if (!feed) return;

    const allEvents = window.dataStore.getEvents();
    const isUpcomingTab = this.activeTab === 'upcoming';

    const filtered = allEvents.filter(ev => {
      // Tab filter
      if (isUpcomingTab && !ev.isUpcoming) return false;
      if (!isUpcomingTab && ev.isUpcoming) return false;

      // Category filter
      if (this.selectedCategory !== 'All' && ev.category !== this.selectedCategory) {
        return false;
      }

      // Search filter
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchDesc = (ev.description || '').toLowerCase().includes(q);
        const matchCat = (ev.category || '').toLowerCase().includes(q);
        const matchVenue = (ev.venue || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat && !matchVenue) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      feed.innerHTML = `
        <div style="text-align: center; padding: 3rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <i class="fa-solid fa-calendar-xmark" style="font-size: 2.5rem; color: var(--text-light); margin-bottom: 1rem;"></i>
          <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--primary-navy); margin-bottom: 0.5rem;">No ${isUpcomingTab ? 'upcoming' : 'past'} events found</h3>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1.25rem;">
            Try selecting another category or clearing your search.
          </p>
          <button class="btn btn-outline btn-sm" onclick="window.eventsModule.resetFilters()">
            Clear Filters
          </button>
        </div>
      `;
      return;
    }

    feed.innerHTML = filtered.map(ev => this.createEventCard(ev)).join('');
  }

  createEventCard(ev) {
    const dateObj = new Date(ev.date);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[dateObj.getMonth()] || 'NOV';
    const day = dateObj.getDate() || '28';
    const year = dateObj.getFullYear() || '2026';

    const isRegistered = ev.registered;

    return `
      <div class="event-card">
        <div class="event-date-badge">
          <span class="month">${month}</span>
          <span class="day">${day}</span>
          <span class="year">${year}</span>
        </div>

        <div class="event-content">
          <div class="event-top-tags">
            <span class="event-category-tag">${ev.category}</span>
            ${ev.badge ? `<span class="event-award-tag">${ev.badge}</span>` : ''}
          </div>

          <h3 class="event-title">${ev.title}</h3>
          <p class="event-desc">${ev.description}</p>

          <div class="event-details-bar">
            <span><i class="fa-regular fa-clock" style="color: var(--secondary-blue);"></i> ${ev.time}</span>
            <span><i class="fa-solid fa-location-dot" style="color: var(--secondary-blue);"></i> ${ev.venue}</span>
            <span><i class="fa-solid fa-users"></i> ${ev.organizer || 'College Dept'}</span>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <div style="font-size: 0.75rem; color: var(--text-muted);">
              ${ev.deadline && ev.deadline !== 'Past' ? `Registration Deadline: <strong>${ev.deadline}</strong>` : ''}
            </div>
            <div style="display: flex; gap: 0.5rem;">
              ${ev.isUpcoming ? `
                <button 
                  class="btn btn-sm ${isRegistered ? 'btn-accent' : 'btn-primary'}" 
                  onclick="window.eventsModule.toggleRsvp('${ev.id}')"
                >
                  <i class="fa-solid ${isRegistered ? 'fa-check' : 'fa-ticket'}"></i>
                  ${isRegistered ? 'Registered / Interested' : 'RSVP / Register'}
                </button>
              ` : `
                <span class="status-badge" style="background: var(--bg-subtle); color: var(--text-muted);">
                  Event Concluded
                </span>
              `}
              <button class="btn btn-sm btn-outline" title="Ask AI details" onclick="window.eventsModule.askAiEventDetails('${ev.title}')">
                <i class="fa-solid fa-robot"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getFullAnnouncementsHtml(notices) {
    if (!notices || notices.length === 0) {
      return `<p style="color: var(--text-muted); font-size: 0.875rem;">No circulars on the notice board.</p>`;
    }

    return notices.map(n => {
      const priClass = n.priority === 'High' ? 'priority-high' : (n.priority === 'Medium' ? 'priority-medium' : 'priority-low');
      return `
        <div style="background: var(--bg-subtle); border-radius: var(--radius-md); padding: 1rem; border-left: 3px solid ${n.priority === 'High' ? 'var(--danger)' : 'var(--secondary-blue)'};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <span class="notice-priority ${priClass}">${n.priority} Priority</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);"><i class="fa-regular fa-calendar"></i> ${n.date}</span>
          </div>
          <h4 style="font-size: 0.9375rem; font-weight: 700; color: var(--primary-navy); margin-bottom: 0.4rem; line-height: 1.35;">
            ${n.title}
          </h4>
          <p style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.5rem;">
            ${n.content}
          </p>
          <div style="font-size: 0.6875rem; color: var(--text-muted); text-align: right;">
            — ${n.author}
          </div>
        </div>
      `;
    }).join('');
  }

  setTab(tab, el) {
    this.activeTab = tab;
    const pills = this.container.querySelectorAll('.tab-pill-group .tab-pill');
    pills.forEach(p => p.classList.remove('active'));
    if (el) el.classList.add('active');
    this.renderEventsFeed();
  }

  handleSearch(val) {
    this.searchQuery = val;
    this.renderEventsFeed();
  }

  handleCategoryFilter(val) {
    this.selectedCategory = val;
    this.renderEventsFeed();
  }

  resetFilters() {
    this.activeTab = 'upcoming';
    this.selectedCategory = 'All';
    this.searchQuery = '';
    const searchInput = document.getElementById('events-search-input');
    if (searchInput) searchInput.value = '';
    const select = document.getElementById('events-category-select');
    if (select) select.value = 'All';
    const pills = this.container.querySelectorAll('.tab-pill-group .tab-pill');
    pills.forEach((p, idx) => p.classList.toggle('active', idx === 0));
    this.renderEventsFeed();
  }

  toggleRsvp(id) {
    const isNowRegistered = window.dataStore.toggleEventRSVP(id);
    window.appRouter.showToast(
      isNowRegistered 
        ? 'Successfully registered for this event! Notification added.' 
        : 'Registration cancelled.',
      isNowRegistered ? 'success' : 'warning'
    );
  }

  askAiEvents() {
    const prompt = `What campus events and hackathons are scheduled? Can you tell me what HackAI 2026 is about and how I can prepare my team?`;
    window.chatbot.openWithPrompt(prompt);
  }

  askAiEventDetails(eventTitle) {
    const prompt = `Tell me all the details about the event: "${eventTitle}". How can a B.Tech CSE (AI/ML) student benefit from attending?`;
    window.chatbot.openWithPrompt(prompt);
  }
}

window.eventsModule = new EventsModule();
