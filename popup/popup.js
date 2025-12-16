// Popup script for DistBlock extension

let currentStatus = null;

// Initialize popup
async function initPopup() {
    await loadStatus();
    setupEventListeners();
    startAutoRefresh();
}

// Load current status
async function loadStatus() {
    try {
        currentStatus = await browser.runtime.sendMessage({ action: 'getStatus' });
        updateUI();
    } catch (error) {
        console.error('Error loading status:', error);
        document.getElementById('statusText').textContent = 'Error loading data';
    }
}

// Update UI with current status
function updateUI() {
    const { enabled, schedules, sites, activeSchedules } = currentStatus;

    // Update toggle
    document.getElementById('enableToggle').checked = enabled;

    // Update status text
    const statusText = document.getElementById('statusText');
    if (!enabled) {
        statusText.textContent = 'Blocking is disabled';
    } else if (activeSchedules.length > 0) {
        statusText.textContent = `${activeSchedules.length} schedule${activeSchedules.length > 1 ? 's' : ''} active`;
    } else {
        statusText.textContent = 'No active schedules';
    }

    // Update active schedules
    const activeSection = document.getElementById('activeSchedulesSection');
    const activeList = document.getElementById('activeSchedulesList');

    if (activeSchedules.length > 0) {
        activeSection.style.display = 'block';
        activeList.innerHTML = activeSchedules.map(schedule => `
      <div class="schedule-item fade-in">
        <div class="schedule-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
        </div>
        <div class="schedule-info">
          <p class="schedule-name body-medium">${escapeHtml(schedule.name || 'Unnamed Schedule')}</p>
          <p class="schedule-time body-small">${schedule.startTime} - ${schedule.endTime}</p>
        </div>
      </div>
    `).join('');
    } else {
        activeSection.style.display = 'none';
    }

    // Update sites list
    const sitesList = document.getElementById('sitesList');
    const siteCount = document.getElementById('siteCount');

    // Get unique URLs from all schedules
    const allUrls = new Set();
    schedules.forEach(schedule => {
        if (schedule.urls) {
            schedule.urls.forEach(url => allUrls.add(url));
        }
    });

    siteCount.textContent = allUrls.size;

    if (allUrls.size > 0) {
        sitesList.innerHTML = Array.from(allUrls).slice(0, 5).map(url => {
            const initial = url.charAt(0).toUpperCase();
            return `
        <div class="site-item fade-in">
          <div class="site-favicon">${initial}</div>
          <div class="site-info">
            <p class="site-name body-medium">${escapeHtml(url)}</p>
          </div>
        </div>
      `;
        }).join('');

        if (allUrls.size > 5) {
            sitesList.innerHTML += `
        <div class="site-item fade-in" style="justify-content: center; opacity: 0.7;">
          <p class="body-small">+${allUrls.size - 5} more sites</p>
        </div>
      `;
        }
    } else {
        sitesList.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <p class="body-medium">No blocked sites yet</p>
        <p class="body-small">Add sites in settings or use quick block</p>
      </div>
    `;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Toggle enabled/disabled
    document.getElementById('enableToggle').addEventListener('change', async (e) => {
        try {
            const result = await browser.runtime.sendMessage({
                action: 'toggleEnabled'
            });
            await loadStatus();
        } catch (error) {
            console.error('Error toggling:', error);
            e.target.checked = !e.target.checked;
        }
    });

    // Quick block current site
    document.getElementById('quickBlockBtn').addEventListener('click', async () => {
        try {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                const url = new URL(tabs[0].url);
                const hostname = url.hostname.replace(/^www\./, '');

                // Open settings page with pre-filled URL
                browser.runtime.openOptionsPage();
                // Store the URL to be picked up by settings page
                await browser.storage.local.set({ quickBlockUrl: hostname });
            }
        } catch (error) {
            console.error('Error quick blocking:', error);
        }
    });

    // Open settings
    document.getElementById('openSettingsBtn').addEventListener('click', () => {
        browser.runtime.openOptionsPage();
    });
}

// Auto-refresh every 30 seconds
function startAutoRefresh() {
    setInterval(loadStatus, 30000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initPopup);
