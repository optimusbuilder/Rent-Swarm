import './style.css'

document.querySelector('#app').innerHTML = `
  <div class="browser-container">
    <div class="browser-window">
      <div class="browser-header">
        <div class="browser-controls">
          <span class="control-dot red"></span>
          <span class="control-dot yellow"></span>
          <span class="control-dot green"></span>
        </div>
        <div class="browser-title">BrowserBase Session</div>
      </div>
      <div class="browser-toolbar">
        <div class="navigation-buttons">
          <button class="nav-btn" id="back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button class="nav-btn" id="forward-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
          <button class="nav-btn" id="refresh-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
          </button>
        </div>
        <div class="address-bar">
          <div class="address-bar-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="5" y="11" width="14" height="10" rx="2"/>
              <circle cx="12" cy="16" r="1"/>
              <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
            </svg>
          </div>
          <input type="text" class="url-input" placeholder="BrowserBase URL will appear here..." readonly />
        </div>
        <button class="menu-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="12" cy="5" r="1"/>
            <circle cx="12" cy="19" r="1"/>
          </svg>
        </button>
      </div>
      <div class="browser-viewport">
        <div class="viewport-placeholder">
          <div class="placeholder-content">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8"/>
              <path d="M12 17v4"/>
            </svg>
            <h2>BrowserBase Window</h2>
            <p>Browser session will be displayed here</p>
            <div class="status-indicator">
              <span class="status-dot"></span>
              <span>Ready to connect</span>
            </div>
          </div>
        </div>
      </div>
      <div class="browser-footer">
        <div class="status-bar">
          <span class="status-text">Status: Idle</span>
          <span class="session-info">No active session</span>
        </div>
      </div>
    </div>
  </div>
`
