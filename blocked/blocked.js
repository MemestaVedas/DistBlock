// Blocked page script

let schedule = null;
let countdownInterval = null;

// Initialize blocked page
function initBlockedPage() {
    const params = new URLSearchParams(window.location.search);
    const blockedUrl = params.get('url');
    const scheduleData = params.get('schedule');

    if (blockedUrl) {
        document.getElementById('blockedUrl').textContent = blockedUrl;
        document.title = `Blocked: ${blockedUrl}`;
    }

    if (scheduleData) {
        try {
            schedule = JSON.parse(decodeURIComponent(scheduleData));
            updateScheduleInfo();
            startCountdown();
        } catch (error) {
            console.error('Error parsing schedule:', error);
        }
    }

    setupEventListeners();
}

// Update schedule information
function updateScheduleInfo() {
    if (!schedule) return;

    document.getElementById('scheduleName').textContent = schedule.name || 'Unnamed Schedule';
    document.getElementById('activeTime').textContent = `${schedule.startTime} - ${schedule.endTime}`;
}

// Start countdown timer
function startCountdown() {
    if (!schedule) return;

    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

// Update countdown display
function updateCountdown() {
    if (!schedule) return;

    const minutes = getMinutesUntilScheduleEnd(schedule);
    const countdownEl = document.getElementById('countdown');

    if (minutes <= 0) {
        countdownEl.textContent = 'Schedule ended - Reloading...';
        clearInterval(countdownInterval);

        // Reload the original URL after a short delay
        setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            const blockedUrl = params.get('url');
            if (blockedUrl) {
                window.location.href = blockedUrl;
            }
        }, 2000);
        return;
    }

    countdownEl.textContent = formatDuration(minutes);
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('settingsBtn').addEventListener('click', () => {
        browser.runtime.openOptionsPage();
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initBlockedPage);

// Cleanup on unload
window.addEventListener('beforeunload', () => {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
});
