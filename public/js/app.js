/**
 * SMART CAMPUS – Main Application Orchestrator & Router
 * Connects all frontend modules, handles navigation, responsive sidebar, toast alerts, and live clock.
 */

class AppRouter {
  constructor() {
    this.currentView = 'dashboard';
    this.views = {
      'dashboard': { el: 'dashboard-view', title: 'Dashboard & Academic Overview', breadcrumb: 'Portal / Overview' },
      'assignments': { el: 'assignments-view', title: 'Coursework & Lab Assignments', breadcrumb: 'Portal / Assignments' },
      'notes': { el: 'notes-view', title: 'Study Notes & Unit Materials', breadcrumb: 'Portal / Notes' },
      'timetable': { el: 'timetable-view', title: 'Class Timetable & Schedule', breadcrumb: 'Portal / Timetable' },
      'events': { el: 'events-view', title: 'Events, Hackathons & Circulars', breadcrumb: 'Portal / Events & Notices' },
      'ai-assistant': { el: 'ai-assistant-view', title: 'Smart AI Academic Tutor', breadcrumb: 'Portal / Smart AI' }
    };
  }

  async init() {
    console.log('[SmartCampus] Initializing Application...');

    // 1. Initialize central data store
    await window.dataStore.init();

    // 2. Initialize modules
    window.dashboardModule.init();
    window.assignmentsModule.init();
    window.notesModule.init();
    window.timetableModule.init();
    window.eventsModule.init();
    await window.chatbot.init();

    // 3. Setup router & listeners
    this.setupNavigation();
    this.setupResponsiveSidebar();
    this.startLiveClock();
    this.updateNotificationBadge();

    // 4. Handle initial route from URL hash if present
    const hash = window.location.hash.replace('#', '');
    if (hash && this.views[hash]) {
      this.navigateTo(hash);
    } else {
      this.navigateTo('dashboard');
    }

    // Subscribe to data changes for badges
    window.dataStore.subscribe(() => {
      this.updateNotificationBadge();
    });

    console.log('[SmartCampus] App successfully initialized.');
  }

  navigateTo(viewId) {
    if (!this.views[viewId]) viewId = 'dashboard';
    this.currentView = viewId;

    // Hide all view sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    // Show target section
    const targetSec = document.getElementById(this.views[viewId].el);
    if (targetSec) {
      targetSec.classList.add('active');
    }

    // Update active state in sidebar menu
    document.querySelectorAll('.sidebar-menu .nav-item').forEach(item => {
      const link = item.querySelector('.nav-link');
      const href = link?.getAttribute('data-view');
      item.classList.toggle('active', href === viewId);
    });

    // Update header title & breadcrumb
    const titleEl = document.getElementById('header-view-title');
    const breadcrumbEl = document.getElementById('header-view-breadcrumb');
    if (titleEl) titleEl.textContent = this.views[viewId].title;
    if (breadcrumbEl) breadcrumbEl.textContent = this.views[viewId].breadcrumb;

    // Update URL hash without reload
    window.location.hash = viewId;

    // Close mobile sidebar if open
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');

    // Scroll window to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setupNavigation() {
    // Attach click events to nav links
    document.querySelectorAll('.nav-link[data-view]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.getAttribute('data-view');
        this.navigateTo(view);
      });
    });

    // Handle browser back/forward buttons
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && this.views[hash] && hash !== this.currentView) {
        this.navigateTo(hash);
      }
    });

    // Global keyboard shortcut Ctrl+K / Cmd+K for AI
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        window.chatbot.toggleFloatingChat();
      }
    });
  }

  setupResponsiveSidebar() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('app-sidebar');

    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });
    }

    // Close on clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && sidebar?.classList.contains('mobile-open')) {
        if (!sidebar.contains(e.target) && !mobileMenuBtn?.contains(e.target)) {
          sidebar.classList.remove('mobile-open');
        }
      }
    });
  }

  startLiveClock() {
    const clockEl = document.getElementById('header-live-clock-text');
    if (!clockEl) return;

    const updateClock = () => {
      const now = new Date();
      const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      clockEl.textContent = now.toLocaleDateString('en-US', options);
    };

    updateClock();
    setInterval(updateClock, 30000);
  }

  updateNotificationBadge() {
    const assignments = window.dataStore.getAssignments();
    const pendingCount = assignments.filter(a => a.status === 'Pending').length;

    // Sidebar badge
    const badgeEl = document.getElementById('sidebar-assignment-badge');
    if (badgeEl) {
      badgeEl.textContent = pendingCount;
      badgeEl.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }

    // Header notification bell badge
    const bellCountEl = document.getElementById('header-bell-count');
    if (bellCountEl) {
      bellCountEl.textContent = pendingCount;
      bellCountEl.style.display = pendingCount > 0 ? 'flex' : 'none';
    }
  }

  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'danger') icon = 'fa-circle-exclamation';
    if (type === 'warning') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  toggleNotificationsDropdown() {
    const assignments = window.dataStore.getAssignments();
    const pending = assignments.filter(a => a.status === 'Pending');
    const announcements = window.dataStore.getAnnouncements();

    const modalHtml = `
      <div class="modal-backdrop active" id="notif-dropdown-modal">
        <div class="modal-dialog" style="max-width: 460px;">
          <div class="modal-header">
            <h3><i class="fa-solid fa-bell" style="color: var(--secondary-blue); margin-right: 0.5rem;"></i> Student Notifications</h3>
            <button class="modal-close-btn" onclick="document.getElementById('notif-dropdown-modal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="max-height: 400px;">
            <h4 style="font-size: 0.8125rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">
              Pending Tasks (${pending.length})
            </h4>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem;">
              ${pending.slice(0, 3).map(p => `
                <div style="padding: 0.6rem 0.75rem; background: var(--bg-subtle); border-radius: 8px; font-size: 0.8125rem;">
                  <strong style="color: var(--primary-navy);">${p.title}</strong>
                  <div style="font-size: 0.75rem; color: var(--danger); margin-top: 2px;">Due: ${p.dueDate}</div>
                </div>
              `).join('')}
            </div>

            <h4 style="font-size: 0.8125rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">
              Campus Circulars (${announcements.length})
            </h4>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              ${announcements.slice(0, 2).map(a => `
                <div style="padding: 0.6rem 0.75rem; background: #EFF6FF; border-radius: 8px; font-size: 0.8125rem;">
                  <strong style="color: var(--primary-navy);">${a.title}</strong>
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">${a.date} • ${a.author}</div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary btn-sm" onclick="document.getElementById('notif-dropdown-modal').remove()">Close</button>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById('notif-dropdown-modal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }
}

// Global router
window.appRouter = new AppRouter();

// Auto-run on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  window.appRouter.init();
});
