// Options/Settings page script for DistBlock extension

let schedules = [];
let editingScheduleId = null;
let selectedDays = [];

// Initialize settings page
async function initSettings() {
    await loadSchedules();
    setupEventListeners();
    checkQuickBlockUrl();
}

// Load schedules from storage
async function loadSchedules() {
    schedules = await getTimeSchedules();
    renderSchedules();
}

// Render schedules list
function renderSchedules() {
    const container = document.getElementById('schedulesList');
    const emptyState = document.getElementById('emptySchedules');

    if (schedules.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    container.innerHTML = schedules.map(schedule => {
        const isActive = schedule.enabled && isTimeInSchedule(schedule);
        const dayNames = schedule.days.map(d => getShortDayName(d)).join(', ');
        const siteCount = schedule.urls ? schedule.urls.length : 0;

        return `
      <div class="schedule-card ${schedule.enabled ? '' : 'disabled'}" data-id="${schedule.id}">
        <div class="schedule-card-header">
          <div class="schedule-card-title">
            <h3>${escapeHtml(schedule.name || 'Unnamed Schedule')}</h3>
            <span class="schedule-status ${isActive ? 'active' : 'inactive'}">
              ${isActive ? '<span class="status-dot"></span> Active Now' : 'Inactive'}
            </span>
          </div>
          <div class="schedule-card-actions">
            <button class="icon-button edit-schedule" data-id="${schedule.id}" title="Edit">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button class="icon-button delete delete-schedule" data-id="${schedule.id}" title="Delete">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="schedule-time">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
          <span class="time-range">${schedule.startTime} - ${schedule.endTime}</span>
        </div>
        
        <div class="schedule-days">
          ${schedule.days.map(d => `<span class="day-badge">${getShortDayName(d)}</span>`).join('')}
        </div>
        
        <div class="schedule-sites">
          <strong>${siteCount}</strong> ${siteCount === 1 ? 'website' : 'websites'} blocked
        </div>
      </div>
    `;
    }).join('');

    // Add event listeners to cards
    document.querySelectorAll('.edit-schedule').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            editSchedule(btn.dataset.id);
        });
    });

    document.querySelectorAll('.delete-schedule').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSchedule(btn.dataset.id);
        });
    });

    document.querySelectorAll('.schedule-card').forEach(card => {
        card.addEventListener('click', () => {
            editSchedule(card.dataset.id);
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Add schedule button
    document.getElementById('addScheduleBtn').addEventListener('click', openScheduleModal);

    // Modal controls
    document.getElementById('closeModal').addEventListener('click', closeScheduleModal);
    document.getElementById('cancelBtn').addEventListener('click', closeScheduleModal);
    document.getElementById('saveScheduleBtn').addEventListener('click', saveSchedule);

    // Day selector
    document.querySelectorAll('.day-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const day = parseInt(chip.dataset.day);
            chip.classList.toggle('selected');

            if (selectedDays.includes(day)) {
                selectedDays = selectedDays.filter(d => d !== day);
            } else {
                selectedDays.push(day);
            }
        });
    });

    // Export/Import
    document.getElementById('exportBtn').addEventListener('click', exportSettings);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importInput').click();
    });
    document.getElementById('importInput').addEventListener('change', importSettings);

    // Close modal on backdrop click
    document.getElementById('scheduleModal').addEventListener('click', (e) => {
        if (e.target.id === 'scheduleModal') {
            closeScheduleModal();
        }
    });
}

// Open schedule modal
function openScheduleModal() {
    editingScheduleId = null;
    selectedDays = [1, 2, 3, 4, 5]; // Default: weekdays

    document.getElementById('modalTitle').textContent = 'Add Schedule';
    document.getElementById('scheduleName').value = '';
    document.getElementById('startTime').value = '09:00';
    document.getElementById('endTime').value = '17:00';
    document.getElementById('websitesList').value = '';
    document.getElementById('scheduleEnabled').checked = true;

    // Reset day selection
    document.querySelectorAll('.day-chip').forEach(chip => {
        const day = parseInt(chip.dataset.day);
        if (selectedDays.includes(day)) {
            chip.classList.add('selected');
        } else {
            chip.classList.remove('selected');
        }
    });

    document.getElementById('scheduleModal').classList.add('show');
}

// Close schedule modal
function closeScheduleModal() {
    document.getElementById('scheduleModal').classList.remove('show');
}

// Edit schedule
function editSchedule(scheduleId) {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    editingScheduleId = scheduleId;
    selectedDays = [...schedule.days];

    document.getElementById('modalTitle').textContent = 'Edit Schedule';
    document.getElementById('scheduleName').value = schedule.name || '';
    document.getElementById('startTime').value = schedule.startTime;
    document.getElementById('endTime').value = schedule.endTime;
    document.getElementById('websitesList').value = schedule.urls.join('\n');
    document.getElementById('scheduleEnabled').checked = schedule.enabled;

    // Update day selection
    document.querySelectorAll('.day-chip').forEach(chip => {
        const day = parseInt(chip.dataset.day);
        if (selectedDays.includes(day)) {
            chip.classList.add('selected');
        } else {
            chip.classList.remove('selected');
        }
    });

    document.getElementById('scheduleModal').classList.add('show');
}

// Save schedule
async function saveSchedule() {
    const name = document.getElementById('scheduleName').value.trim();
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const websitesText = document.getElementById('websitesList').value;
    const enabled = document.getElementById('scheduleEnabled').checked;

    // Validate
    if (!name) {
        alert('Please enter a schedule name');
        return;
    }

    if (selectedDays.length === 0) {
        alert('Please select at least one day');
        return;
    }

    const urls = websitesText
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

    if (urls.length === 0) {
        alert('Please enter at least one website');
        return;
    }

    const scheduleData = {
        name,
        startTime,
        endTime,
        days: selectedDays.sort((a, b) => a - b),
        urls,
        enabled
    };

    if (editingScheduleId) {
        // Update existing
        schedules = schedules.map(s =>
            s.id === editingScheduleId ? { ...scheduleData, id: editingScheduleId } : s
        );
    } else {
        // Add new
        schedules.push({
            ...scheduleData,
            id: Date.now().toString()
        });
    }

    await setTimeSchedules(schedules);
    await loadSchedules();
    closeScheduleModal();
}

// Delete schedule
async function deleteSchedule(scheduleId) {
    if (!confirm('Are you sure you want to delete this schedule?')) {
        return;
    }

    schedules = schedules.filter(s => s.id !== scheduleId);
    await setTimeSchedules(schedules);
    await loadSchedules();
}

// Export settings
async function exportSettings() {
    const data = {
        schedules: await getTimeSchedules(),
        exportDate: new Date().toISOString(),
        version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `distblock-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Import settings
async function importSettings(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (data.schedules && Array.isArray(data.schedules)) {
            if (confirm('This will replace all your current schedules. Continue?')) {
                await setTimeSchedules(data.schedules);
                await loadSchedules();
                alert('Settings imported successfully!');
            }
        } else {
            alert('Invalid settings file');
        }
    } catch (error) {
        console.error('Import error:', error);
        alert('Error importing settings');
    }

    e.target.value = '';
}

// Check for quick block URL from popup
async function checkQuickBlockUrl() {
    const result = await browser.storage.local.get('quickBlockUrl');
    if (result.quickBlockUrl) {
        // Open modal with pre-filled URL
        openScheduleModal();
        document.getElementById('websitesList').value = result.quickBlockUrl;
        document.getElementById('scheduleName').value = 'Quick Block - ' + result.quickBlockUrl;

        // Clear the quick block URL
        await browser.storage.local.remove('quickBlockUrl');
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initSettings);
