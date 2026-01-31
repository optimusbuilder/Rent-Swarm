function Viewport() {
  return (
    <div className="browser-viewport">
      <div className="viewport-placeholder">
        <div className="placeholder-content">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8"/>
            <path d="M12 17v4"/>
          </svg>
          <h2>BrowserBase Window</h2>
          <p>Browser session will be displayed here</p>
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span>Ready to connect</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Viewport
