/**
 * SMART CAMPUS – Smart AI Assistant (Gemini API Integration)
 * Controls floating widget + dedicated full-page AI view, chat history,
 * suggested prompts, markdown parsing, and live backend communication.
 */

class ChatbotController {
  constructor() {
    this.history = [];
    this.isGenerating = false;
    this.isFloatingOpen = false;
    this.apiStatus = { isConfigured: false, model: 'gemini-2.5-flash', status: 'CHECKING' };
    this.suggestedPrompts = [
      'What classes do I have scheduled for today?',
      'Show my pending assignments and upcoming deadlines.',
      'Explain Red-Black Tree rotations step-by-step with complexity.',
      'What campus events or hackathons are coming up?',
      'Create a 3-day study schedule for Operating Systems.',
      'Who is the faculty for Computer Networks and which room?'
    ];
  }

  async init() {
    // Load persisted chat history
    this.history = window.dataStore.getChatHistory();
    await this.checkApiStatus();
    this.renderFloatingChatWidget();
    this.renderDedicatedAiView();
  }

  async checkApiStatus() {
    try {
      const res = await fetch('/api/chat/status');
      if (res.ok) {
        this.apiStatus = await res.json();
      }
    } catch (e) {
      console.warn('Could not reach /api/chat/status:', e.message);
      this.apiStatus = {
        isConfigured: false,
        model: 'gemini-2.5-flash',
        status: 'OFFLINE'
      };
    }
  }

  // ==================== FLOATING CHAT WIDGET ====================

  renderFloatingChatWidget() {
    let widget = document.getElementById('smart-ai-floating-container');
    if (!widget) {
      widget = document.createElement('div');
      widget.id = 'smart-ai-floating-container';
      document.body.appendChild(widget);
    }

    const isConnected = this.apiStatus.isConfigured;

    widget.innerHTML = `
      <!-- FAB Floating Button -->
      <button class="chat-widget-fab" id="chat-fab-btn" onclick="window.chatbot.toggleFloatingChat()" title="Open Smart AI Assistant">
        <i class="fa-solid fa-robot"></i>
        <span class="chat-fab-pulse"></span>
      </button>

      <!-- Floating Chat Window -->
      <div class="floating-chat-window" id="floating-chat-window">
        <!-- Header -->
        <div class="chat-window-header">
          <div class="chat-header-info">
            <div class="chat-bot-avatar">
              <i class="fa-solid fa-brain"></i>
            </div>
            <div class="chat-bot-details">
              <h4>Smart AI Assistant</h4>
              <span class="chat-status-indicator">
                <span class="pulse-dot" style="background: ${isConnected ? '#38BDF8' : '#F59E0B'};"></span>
                ${isConnected ? `${this.apiStatus.model} Connected` : 'Awaiting API Key'}
              </span>
            </div>
          </div>
          <div class="chat-header-actions">
            <button class="chat-action-btn" title="Open Dedicated View" onclick="window.chatbot.openDedicatedView()">
              <i class="fa-solid fa-expand"></i>
            </button>
            <button class="chat-action-btn" title="Clear Chat History" onclick="window.chatbot.clearHistory()">
              <i class="fa-solid fa-trash-can"></i>
            </button>
            <button class="chat-action-btn" title="Close" onclick="window.chatbot.toggleFloatingChat(false)">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Missing API Key Notice (if unconfigured) -->
        ${!isConnected ? this.getApiKeyBannerHtml() : ''}

        <!-- Chat Messages Area -->
        <div class="chat-messages-area" id="floating-chat-messages">
          ${this.renderMessagesHtml()}
        </div>

        <!-- Suggested Prompts Chips -->
        <div class="chat-suggestions-container" id="floating-chat-suggestions">
          ${this.suggestedPrompts.map(p => `
            <button class="suggestion-chip" onclick="window.chatbot.sendDirectPrompt('${this.escapeHtml(p)}')">
              ${p}
            </button>
          `).join('')}
        </div>

        <!-- Input Bar -->
        <div class="chat-input-bar">
          <input 
            type="text" 
            class="chat-input-field" 
            id="floating-chat-input" 
            placeholder="Ask about syllabus, schedules, assignments, concepts..."
            onkeydown="if(event.key === 'Enter') window.chatbot.sendMessageFromFloating()"
          />
          <button class="chat-send-btn" id="floating-send-btn" onclick="window.chatbot.sendMessageFromFloating()" title="Send">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    `;

    this.scrollToBottom('floating-chat-messages');
  }

  // ==================== DEDICATED FULL-PAGE AI VIEW ====================

  renderDedicatedAiView() {
    const container = document.getElementById('ai-assistant-view');
    if (!container) return;

    const isConnected = this.apiStatus.isConfigured;

    container.innerHTML = `
      <div class="ai-view-container">
        <!-- Left Sidebar: Capabilities, Grounded Data Info & Suggestions -->
        <div class="ai-sidebar-panel">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: linear-gradient(135deg, var(--secondary-blue), var(--primary-navy)); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              <i class="fa-solid fa-brain"></i>
            </div>
            <div>
              <h3 style="font-size: 1.0625rem; font-weight: 800; color: var(--primary-navy);">Smart AI</h3>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Official Campus AI Tutor</span>
            </div>
          </div>

          <!-- Status Card -->
          <div style="background: var(--bg-subtle); padding: 0.875rem; border-radius: var(--radius-md); font-size: 0.8125rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem;">
              <span style="font-weight: 700; color: var(--text-primary);">AI Engine:</span>
              <span class="status-badge ${isConnected ? 'submitted' : 'pending'}">
                ${isConnected ? 'Online' : 'Setup Required'}
              </span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">
              Model: <strong>${this.apiStatus.model}</strong>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
              Grounding: <strong>Live Portal Database</strong>
            </div>
          </div>

          <!-- Context Grounding Badge -->
          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: var(--radius-md); padding: 0.875rem; font-size: 0.8125rem;">
            <h4 style="font-size: 0.8125rem; font-weight: 700; color: var(--primary-navy); margin-bottom: 0.25rem;">
              <i class="fa-solid fa-database" style="color: var(--secondary-blue);"></i> Grounded Knowledge
            </h4>
            <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;">
              Smart AI has live access to your 3rd semester subjects, syllabus notes, pending assignments, room numbers, and timetable!
            </p>
          </div>

          <!-- Suggested Prompts Column -->
          <div>
            <h4 style="font-size: 0.8125rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.6rem; text-transform: uppercase;">
              Suggested Questions
            </h4>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              ${this.suggestedPrompts.map(p => `
                <button 
                  class="btn btn-outline btn-sm" 
                  style="text-align: left; justify-content: flex-start; font-size: 0.8125rem; line-height: 1.35; padding: 0.6rem 0.75rem;"
                  onclick="window.chatbot.sendDirectPrompt('${this.escapeHtml(p)}')"
                >
                  <i class="fa-regular fa-comment-dots" style="color: var(--secondary-blue); flex-shrink: 0;"></i>
                  <span>${p}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border-color); display: flex; gap: 0.5rem;">
            <button class="btn btn-sm btn-outline" style="flex: 1;" onclick="window.chatbot.clearHistory()">
              <i class="fa-solid fa-trash-can"></i> Clear Chat
            </button>
            <button class="btn btn-sm btn-outline" style="flex: 1;" onclick="window.chatbot.openApiKeyGuide()">
              <i class="fa-solid fa-key"></i> API Config
            </button>
          </div>
        </div>

        <!-- Right: Full Chat Panel -->
        <div class="ai-main-chat-panel">
          <div class="chat-window-header">
            <div class="chat-header-info">
              <div class="chat-bot-avatar">
                <i class="fa-solid fa-robot"></i>
              </div>
              <div class="chat-bot-details">
                <h4>Smart Campus AI Academic Assistant</h4>
                <span class="chat-status-indicator">
                  <span class="pulse-dot" style="background: ${isConnected ? '#38BDF8' : '#F59E0B'};"></span>
                  ${isConnected ? `Google Gemini (${this.apiStatus.model}) Connected` : 'Configuration Required'}
                </span>
              </div>
            </div>
            <div class="chat-header-actions">
              <button class="chat-action-btn" title="Clear Chat History" onclick="window.chatbot.clearHistory()">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>

          ${!isConnected ? this.getApiKeyBannerHtml() : ''}

          <!-- Chat Messages Area -->
          <div class="chat-messages-area" id="dedicated-chat-messages">
            ${this.renderMessagesHtml()}
          </div>

          <!-- Input Bar -->
          <div class="chat-input-bar">
            <input 
              type="text" 
              class="chat-input-field" 
              id="dedicated-chat-input" 
              placeholder="Ask anything: assignments, notes, algorithms, schedules, exam prep..."
              onkeydown="if(event.key === 'Enter') window.chatbot.sendMessageFromDedicated()"
            />
            <button class="chat-send-btn" id="dedicated-send-btn" onclick="window.chatbot.sendMessageFromDedicated()" title="Send">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    this.scrollToBottom('dedicated-chat-messages');
  }

  getApiKeyBannerHtml() {
    return `
      <div class="api-key-banner" style="margin: 0.75rem 1rem;">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div style="flex: 1;">
          <strong>Gemini API Key Required:</strong> Add your <code>GEMINI_API_KEY</code> in the <code>.env</code> file to enable live AI responses.
          <button class="btn btn-sm btn-outline" style="margin-top: 0.35rem; font-size: 0.75rem; padding: 2px 8px;" onclick="window.chatbot.openApiKeyGuide()">
            View Setup Instructions
          </button>
        </div>
      </div>
    `;
  }

  // ==================== MESSAGE RENDERING ====================

  renderMessagesHtml() {
    if (!this.history || this.history.length === 0) {
      return `
        <div style="text-align: center; padding: 2.5rem 1.5rem; color: var(--text-muted);">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #EFF6FF; color: var(--secondary-blue); display: flex; align-items: center; justify-content: center; font-size: 1.75rem; margin: 0 auto 1rem auto;">
            <i class="fa-solid fa-graduation-cap"></i>
          </div>
          <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--primary-navy); margin-bottom: 0.5rem;">
            Hello! I am Smart AI 🎓
          </h3>
          <p style="font-size: 0.875rem; max-width: 380px; margin: 0 auto; line-height: 1.5;">
            Your academic partner for B.Tech CSE (AI/ML). Ask me about your class timetable, pending assignment deadlines, study notes, or algorithm concepts!
          </p>
        </div>
      `;
    }

    return this.history.map(msg => {
      const isBot = msg.role === 'model' || msg.role === 'bot';
      const formattedContent = this.formatMarkdown(msg.content);

      return `
        <div class="chat-bubble ${isBot ? 'bot' : 'user'}">
          <div class="bubble-avatar">
            <i class="fa-solid ${isBot ? 'fa-robot' : 'fa-user'}"></i>
          </div>
          <div class="bubble-content">
            ${formattedContent}
            <div class="bubble-time">${msg.time || ''}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  formatMarkdown(text) {
    if (!text) return '';
    let out = String(text);

    // Escape HTML brackets
    out = out.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Code blocks ```code```
    out = out.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang}">${code}</code></pre>`;
    });

    // Inline code `code`
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold **text**
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic *text*
    out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Bullet points
    out = out.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');
    out = out.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Numbered lists
    out = out.replace(/^\s*(\d+)\.\s+(.*)$/gm, '<li>$2</li>');

    // Headings ### Heading
    out = out.replace(/^###\s+(.*)$/gm, '<h5 style="font-weight:700; margin:0.5rem 0 0.25rem 0;">$1</h5>');
    out = out.replace(/^##\s+(.*)$/gm, '<h4 style="font-weight:700; margin:0.5rem 0 0.25rem 0;">$1</h4>');

    // Line breaks to paragraphs
    const paragraphs = out.split(/\n\s*\n/).filter(Boolean);
    if (paragraphs.length > 1) {
      out = paragraphs.map(p => {
        if (p.startsWith('<pre>') || p.startsWith('<ul>') || p.startsWith('<h4>') || p.startsWith('<h5>')) return p;
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
      }).join('');
    } else {
      out = out.replace(/\n/g, '<br>');
    }

    return out;
  }

  // ==================== SEND MESSAGE HANDLER ====================

  async sendMessage(userMessage) {
    if (!userMessage || !userMessage.trim() || this.isGenerating) return;
    const cleanMsg = userMessage.trim();

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append to conversation history
    this.history.push({
      role: 'user',
      content: cleanMsg,
      time: timestamp
    });
    window.dataStore.saveChatHistory(this.history);

    // Update UI in both floating and dedicated panels
    this.updateChatUi();
    this.showTypingIndicator();

    this.isGenerating = true;

    try {
      // Grounding context from current student portal state
      const groundingContext = window.dataStore.getGroundingContext();

      // Format past history for multi-turn conversational context
      const historyPayload = this.history.slice(-8).map(h => ({
        role: (h.role === 'model' || h.role === 'bot') ? 'model' : 'user',
        content: h.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanMsg,
          history: historyPayload.slice(0, -1), // Prior turns
          studentContext: groundingContext
        })
      });

      const data = await response.json();
      this.hideTypingIndicator();

      if (!response.ok || !data.success) {
        // Handle API key missing or error gracefully
        const errorMsg = data.message || 'Unable to generate response from Gemini API.';
        const setupHelp = data.setupInstructions;
        
        let replyContent = `⚠️ **Error [${data.error || 'API_ERROR'}]:** ${errorMsg}`;
        if (setupHelp) {
          replyContent += `\n\n**Setup Instructions:**\n\`\`\`\n${setupHelp}\n\`\`\``;
        }

        this.history.push({
          role: 'model',
          content: replyContent,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } else {
        // Success response from Gemini API
        const modelTag = data.model ? ` • ${data.model}` : '';
        this.history.push({
          role: 'model',
          content: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + modelTag
        });
      }

      window.dataStore.saveChatHistory(this.history);
      this.updateChatUi();
    } catch (err) {
      console.error('Chat error:', err);
      this.hideTypingIndicator();
      this.history.push({
        role: 'model',
        content: `⚠️ **Connection Error:** Could not contact the backend API endpoint. Please check your network connection or server status.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      window.dataStore.saveChatHistory(this.history);
      this.updateChatUi();
    } finally {
      this.isGenerating = false;
    }
  }

  showTypingIndicator() {
    const indicatorHtml = `
      <div class="chat-bubble bot" id="active-typing-indicator">
        <div class="bubble-avatar">
          <i class="fa-solid fa-robot"></i>
        </div>
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;

    const floatArea = document.getElementById('floating-chat-messages');
    if (floatArea) {
      floatArea.insertAdjacentHTML('beforeend', indicatorHtml);
      this.scrollToBottom('floating-chat-messages');
    }

    const dedArea = document.getElementById('dedicated-chat-messages');
    if (dedArea) {
      dedArea.insertAdjacentHTML('beforeend', indicatorHtml);
      this.scrollToBottom('dedicated-chat-messages');
    }
  }

  hideTypingIndicator() {
    const indicators = document.querySelectorAll('#active-typing-indicator');
    indicators.forEach(i => i.remove());
  }

  updateChatUi() {
    const floatArea = document.getElementById('floating-chat-messages');
    if (floatArea) {
      floatArea.innerHTML = this.renderMessagesHtml();
      this.scrollToBottom('floating-chat-messages');
    }

    const dedArea = document.getElementById('dedicated-chat-messages');
    if (dedArea) {
      dedArea.innerHTML = this.renderMessagesHtml();
      this.scrollToBottom('dedicated-chat-messages');
    }
  }

  scrollToBottom(id) {
    const el = document.getElementById(id);
    if (el) {
      setTimeout(() => { el.scrollTop = el.scrollHeight; }, 50);
    }
  }

  sendMessageFromFloating() {
    const input = document.getElementById('floating-chat-input');
    if (input && input.value.trim()) {
      const text = input.value.trim();
      input.value = '';
      this.sendMessage(text);
    }
  }

  sendMessageFromDedicated() {
    const input = document.getElementById('dedicated-chat-input');
    if (input && input.value.trim()) {
      const text = input.value.trim();
      input.value = '';
      this.sendMessage(text);
    }
  }

  sendDirectPrompt(promptText) {
    if (!this.isFloatingOpen && document.getElementById('ai-assistant-view').style.display !== 'block') {
      this.toggleFloatingChat(true);
    }
    this.sendMessage(promptText);
  }

  openWithPrompt(promptText) {
    this.toggleFloatingChat(true);
    const input = document.getElementById('floating-chat-input');
    if (input) {
      input.value = promptText;
      input.focus();
    }
  }

  toggleFloatingChat(forceState) {
    const win = document.getElementById('floating-chat-window');
    if (!win) return;

    if (forceState !== undefined) {
      this.isFloatingOpen = forceState;
    } else {
      this.isFloatingOpen = !this.isFloatingOpen;
    }

    win.classList.toggle('active', this.isFloatingOpen);
    if (this.isFloatingOpen) {
      this.scrollToBottom('floating-chat-messages');
      const input = document.getElementById('floating-chat-input');
      if (input) input.focus();
    }
  }

  openDedicatedView() {
    this.toggleFloatingChat(false);
    window.appRouter.navigateTo('ai-assistant');
  }

  clearHistory() {
    if (confirm('Are you sure you want to clear your Smart AI conversation history?')) {
      this.history = [];
      window.dataStore.clearChatHistory();
      this.updateChatUi();
      window.appRouter.showToast('Chat history cleared.', 'warning');
    }
  }

  openApiKeyGuide() {
    const modalHtml = `
      <div class="modal-backdrop active" id="api-key-guide-modal">
        <div class="modal-dialog" style="max-width: 580px;">
          <div class="modal-header">
            <h3><i class="fa-solid fa-key" style="color: var(--secondary-blue); margin-right: 0.5rem;"></i> Gemini API Configuration</h3>
            <button class="modal-close-btn" onclick="document.getElementById('api-key-guide-modal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="font-size: 0.875rem; line-height: 1.6;">
            <p style="margin-bottom: 1rem;">
              Smart Campus uses <strong>Google Gemini API</strong> for intelligent academic assistance. Follow these 3 easy steps to connect your API key:
            </p>
            <ol style="padding-left: 1.25rem; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem;">
              <li>
                <strong>Get your Free Gemini API Key:</strong> Visit 
                <a href="https://aistudio.google.com/" target="_blank" style="text-decoration: underline; font-weight: 700;">Google AI Studio</a> 
                and click <em>Get API key</em>.
              </li>
              <li>
                <strong>Configure in .env file:</strong> Open the <code>.env</code> file in the project root directory and set:
                <pre style="margin-top: 0.35rem; padding: 0.5rem; background: #0B2545; color: #38BDF8; border-radius: 6px;">GEMINI_API_KEY=AIzaSyYourActualKeyHere\nGEMINI_MODEL=gemini-2.5-flash</pre>
              </li>
              <li>
                <strong>Restart Server:</strong> In your terminal, restart the Express server (<code>npm start</code> or <code>npm run dev</code>).
              </li>
            </ol>
            <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 0.75rem;">
              <i class="fa-solid fa-shield-halved" style="color: var(--secondary-blue);"></i>
              <strong>Security Assurance:</strong> Your API key is safely held on the backend server and is never sent to the client browser.
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="document.getElementById('api-key-guide-modal').remove()">Understood</button>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById('api-key-guide-modal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  escapeHtml(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }
}

window.chatbot = new ChatbotController();
