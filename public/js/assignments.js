/**
 * SMART CAMPUS – Assignments Module
 * Subject-wise assignment tracking, pending/submitted/overdue filters, search, deadline alerts,
 * and mark-as-submitted interactive state with localStorage persistence.
 */

class AssignmentsModule {
  constructor() {
    this.container = document.getElementById('assignments-view');
    this.currentFilter = 'All'; // 'All' | 'Pending' | 'Submitted' | 'Overdue'
    this.currentSubject = 'All';
    this.searchQuery = '';
  }

  init() {
    this.render();
    window.dataStore.subscribe(() => {
      this.renderList();
    });
  }

  render() {
    if (!this.container) return;
    const subjects = window.dataStore.getSubjects();

    this.container.innerHTML = `
      <!-- Section Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--primary-navy);">
            <i class="fa-solid fa-list-check" style="color: var(--secondary-blue); margin-right: 0.5rem;"></i>
            Academic Assignments & Lab Submissions
          </h2>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;">
            Manage coursework, monitor upcoming deadlines, and mark assignments as submitted.
          </p>
        </div>
        <button class="btn btn-primary" onclick="window.assignmentsModule.openAddModal()">
          <i class="fa-solid fa-plus"></i> Add Assignment
        </button>
      </div>

      <!-- Filter & Search Toolbar -->
      <div class="filter-toolbar">
        <!-- Search Box -->
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input 
            type="text" 
            class="search-input" 
            id="assignment-search-input" 
            placeholder="Search assignments by title, subject or keywords..."
            oninput="window.assignmentsModule.handleSearch(this.value)"
          >
        </div>

        <!-- Status Filter Pills -->
        <div class="tab-pill-group">
          <button class="tab-pill active" onclick="window.assignmentsModule.setFilter('All', this)">All</button>
          <button class="tab-pill" onclick="window.assignmentsModule.setFilter('Pending', this)">Pending</button>
          <button class="tab-pill" onclick="window.assignmentsModule.setFilter('Submitted', this)">Submitted</button>
          <button class="tab-pill" onclick="window.assignmentsModule.setFilter('Overdue', this)">Overdue</button>
        </div>

        <!-- Subject Select Filter -->
        <div class="filter-group">
          <label style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted);">Subject:</label>
          <select class="filter-select" id="assignment-subject-select" onchange="window.assignmentsModule.handleSubjectFilter(this.value)">
            <option value="All">All Subjects</option>
            ${subjects.map(s => `<option value="${s.name}">${s.shortName} – ${s.name}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Quick Summary Counters -->
      <div id="assignment-summary-bar" style="margin-bottom: 1.5rem; font-size: 0.875rem; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
        <span id="assignment-count-label">Loading assignments...</span>
        <button class="btn btn-outline btn-sm" onclick="window.assignmentsModule.askAiAboutAssignments()">
          <i class="fa-solid fa-robot" style="color: var(--secondary-blue);"></i> Ask AI to Prioritize My Due Dates
        </button>
      </div>

      <!-- Assignments Grid -->
      <div class="assignments-grid" id="assignments-grid-container">
        <!-- Injected via renderList() -->
      </div>
    `;

    this.renderList();
  }

  renderList() {
    const gridContainer = document.getElementById('assignments-grid-container');
    const countLabel = document.getElementById('assignment-count-label');
    if (!gridContainer) return;

    const all = window.dataStore.getAssignments();
    
    // Filter
    let filtered = all.filter(item => {
      // Status filter
      if (this.currentFilter !== 'All' && item.status !== this.currentFilter) {
        return false;
      }
      // Subject filter
      if (this.currentSubject !== 'All' && item.subject !== this.currentSubject) {
        return false;
      }
      // Search
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSubject = item.subject.toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        const matchCode = (item.code || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSubject && !matchDesc && !matchCode) return false;
      }
      return true;
    });

    if (countLabel) {
      countLabel.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${all.length}</strong> assignments`;
    }

    if (filtered.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <i class="fa-solid fa-clipboard-question" style="font-size: 2.5rem; color: var(--text-light); margin-bottom: 1rem;"></i>
          <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--primary-navy); margin-bottom: 0.5rem;">No assignments found</h3>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1.25rem;">
            No assignments match your current filters. Try changing or clearing your search criteria.
          </p>
          <button class="btn btn-outline btn-sm" onclick="window.assignmentsModule.resetFilters()">
            Clear Filters
          </button>
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = filtered.map(item => this.createAssignmentCard(item)).join('');
  }

  createAssignmentCard(item) {
    const isPending = item.status === 'Pending';
    const isSubmitted = item.status === 'Submitted';
    const isOverdue = item.status === 'Overdue';

    let borderClass = '';
    if (isSubmitted) borderClass = 'submitted-border';
    else if (isOverdue) borderClass = 'overdue-border';
    else if (item.isApproaching) borderClass = 'urgent-border';

    let badgeHtml = '';
    if (isPending) {
      badgeHtml = `<span class="status-badge pending"><i class="fa-solid fa-clock"></i> Pending</span>`;
    } else if (isSubmitted) {
      badgeHtml = `<span class="status-badge submitted"><i class="fa-solid fa-circle-check"></i> Submitted</span>`;
    } else {
      badgeHtml = `<span class="status-badge overdue"><i class="fa-solid fa-triangle-exclamation"></i> Overdue</span>`;
    }

    return `
      <div class="assignment-card ${borderClass}">
        <div class="assignment-header">
          <span class="subject-tag">${item.code || 'CS'} • ${item.subject}</span>
          ${badgeHtml}
        </div>

        <h3 class="assignment-title">${item.title}</h3>
        <p class="assignment-desc">${item.description || 'No additional instructions provided.'}</p>

        <div class="assignment-dates">
          <div class="date-block">
            <strong>Assigned Date</strong>
            <span>${item.assignedDate}</span>
          </div>
          <div class="date-block">
            <strong>Due Date</strong>
            <span class="${item.isApproaching && isPending ? 'deadline-highlight' : ''}">
              ${item.dueDate} ${item.isApproaching && isPending ? '⚠️ DUE SOON' : ''}
            </span>
          </div>
          ${isSubmitted && item.submittedDate ? `
            <div class="date-block" style="grid-column: 1 / -1; border-top: 1px dashed var(--border-color); padding-top: 4px;">
              <strong>Submitted On:</strong>
              <span style="color: var(--success);">${item.submittedDate} ${item.grade ? `(Grade: ${item.grade})` : ''}</span>
            </div>
          ` : ''}
        </div>

        <div class="assignment-footer">
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            <i class="fa-solid fa-weight-hanging"></i> ${item.weightage || 'Graded'}
          </div>
          <div style="display: flex; gap: 0.5rem;">
            ${isPending ? `
              <button class="btn btn-sm btn-primary" onclick="window.assignmentsModule.toggleSubmit('${item.id}', 'Submitted')">
                <i class="fa-solid fa-check"></i> Mark Submitted
              </button>
            ` : `
              <button class="btn btn-sm btn-outline" onclick="window.assignmentsModule.toggleSubmit('${item.id}', 'Pending')">
                <i class="fa-solid fa-rotate-left"></i> Reopen
              </button>
            `}
            <button class="btn btn-sm btn-outline" title="Ask AI for step-by-step help" onclick="window.assignmentsModule.askAiHelp('${item.title}', '${item.subject}')">
              <i class="fa-solid fa-robot"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  handleSearch(val) {
    this.searchQuery = val;
    this.renderList();
  }

  setFilter(filter, el) {
    this.currentFilter = filter;
    const pills = this.container.querySelectorAll('.tab-pill');
    pills.forEach(p => p.classList.remove('active'));
    if (el) el.classList.add('active');
    this.renderList();
  }

  handleSubjectFilter(val) {
    this.currentSubject = val;
    this.renderList();
  }

  resetFilters() {
    this.currentFilter = 'All';
    this.currentSubject = 'All';
    this.searchQuery = '';
    const searchInput = document.getElementById('assignment-search-input');
    if (searchInput) searchInput.value = '';
    const select = document.getElementById('assignment-subject-select');
    if (select) select.value = 'All';
    const pills = this.container.querySelectorAll('.tab-pill');
    pills.forEach((p, idx) => {
      p.classList.toggle('active', idx === 0);
    });
    this.renderList();
  }

  toggleSubmit(id, newStatus) {
    const success = window.dataStore.updateAssignmentStatus(id, newStatus);
    if (success) {
      window.appRouter.showToast(
        newStatus === 'Submitted' 
          ? 'Assignment marked as submitted!' 
          : 'Assignment reopened as pending.',
        newStatus === 'Submitted' ? 'success' : 'warning'
      );
    }
  }

  askAiHelp(title, subject) {
    const prompt = `Help me with my assignment: "${title}" for ${subject}. Can you give me an overview, key algorithm concepts, and step-by-step approach to complete it?`;
    window.chatbot.openWithPrompt(prompt);
  }

  askAiAboutAssignments() {
    const prompt = `Can you analyze my current assignments and deadlines? Tell me which ones are approaching urgently and give me a prioritized study plan for this week.`;
    window.chatbot.openWithPrompt(prompt);
  }

  openAddModal() {
    const subjects = window.dataStore.getSubjects();
    const modalHtml = `
      <div class="modal-backdrop active" id="add-assignment-modal">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3><i class="fa-solid fa-plus-circle" style="color: var(--secondary-blue); margin-right: 0.5rem;"></i> Add New Assignment</h3>
            <button class="modal-close-btn" onclick="document.getElementById('add-assignment-modal').remove()">&times;</button>
          </div>
          <form id="add-assignment-form" onsubmit="window.assignmentsModule.handleCreateSubmit(event)">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Assignment Title *</label>
                <input type="text" class="form-control" name="title" required placeholder="e.g., Graph Dijkstra Implementation" />
              </div>

              <div class="form-group">
                <label class="form-label">Subject *</label>
                <select class="form-control" name="subject" required>
                  ${subjects.map(s => `<option value="${s.name}">${s.shortName} – ${s.name}</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Due Date *</label>
                <input type="date" class="form-control" name="dueDate" required value="${new Date(Date.now() + 5*86400000).toISOString().split('T')[0]}" />
              </div>

              <div class="form-group">
                <label class="form-label">Description & Instructions</label>
                <textarea class="form-control" name="description" placeholder="Specify code requirements, page count, or guidelines..."></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Weightage / Marks</label>
                <input type="text" class="form-control" name="weightage" placeholder="e.g. 10% Internal Marks / 25 Marks" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" onclick="document.getElementById('add-assignment-modal').remove()">Cancel</button>
              <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Save Assignment</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const existing = document.getElementById('add-assignment-modal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  handleCreateSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const subjects = window.dataStore.getSubjects();
    const subjectName = formData.get('subject');
    const matchedSubject = subjects.find(s => s.name === subjectName);

    const newRecord = {
      title: formData.get('title'),
      subject: subjectName,
      code: matchedSubject ? matchedSubject.code : 'GEN',
      dueDate: formData.get('dueDate'),
      description: formData.get('description'),
      weightage: formData.get('weightage') || '10% Internal Marks',
      status: 'Pending'
    };

    window.dataStore.addAssignment(newRecord);
    document.getElementById('add-assignment-modal').remove();
    window.appRouter.showToast('Assignment added successfully!', 'success');
  }
}

window.assignmentsModule = new AssignmentsModule();
