// Time utilities for DistBlock extension

// Parse time string (HH:MM) to minutes since midnight
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Get current time in minutes since midnight
function getCurrentMinutes() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

// Format minutes to HH:MM string
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Check if current time is within a schedule
function isTimeInSchedule(schedule) {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentMinutes = getCurrentMinutes();

    // Check if today is in the schedule's active days
    if (!schedule.days.includes(currentDay)) {
        return false;
    }

    const startMinutes = timeToMinutes(schedule.startTime);
    const endMinutes = timeToMinutes(schedule.endTime);

    // Handle schedules that cross midnight
    if (endMinutes < startMinutes) {
        return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

// Check if a URL should be blocked based on schedules
async function shouldBlockUrl(url, schedules) {
    if (!schedules || schedules.length === 0) {
        return false;
    }

    // Check each schedule
    for (const schedule of schedules) {
        if (schedule.enabled && isTimeInSchedule(schedule)) {
            // Check if URL matches any pattern in this schedule
            for (const pattern of schedule.urls) {
                if (urlMatchesPattern(url, pattern)) {
                    return true;
                }
            }
        }
    }

    return false;
}

// Check if URL matches a pattern (supports wildcards)
function urlMatchesPattern(url, pattern) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        // Remove protocol and www
        const cleanPattern = pattern.replace(/^(https?:\/\/)?(www\.)?/, '');
        const cleanHostname = hostname.replace(/^www\./, '');

        // Exact match
        if (cleanPattern === cleanHostname) {
            return true;
        }

        // Wildcard match (*.example.com)
        if (cleanPattern.startsWith('*.')) {
            const domain = cleanPattern.substring(2);
            return cleanHostname === domain || cleanHostname.endsWith('.' + domain);
        }

        // Subdomain match
        if (cleanHostname.endsWith('.' + cleanPattern)) {
            return true;
        }

        return false;
    } catch (e) {
        return false;
    }
}

// Get time until schedule ends (in minutes)
function getMinutesUntilScheduleEnd(schedule) {
    const currentMinutes = getCurrentMinutes();
    const endMinutes = timeToMinutes(schedule.endTime);

    if (endMinutes > currentMinutes) {
        return endMinutes - currentMinutes;
    } else {
        // Schedule ends tomorrow
        return (24 * 60) - currentMinutes + endMinutes;
    }
}

// Format minutes to human-readable duration
function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }

    return `${hours} hour${hours !== 1 ? 's' : ''} and ${mins} minute${mins !== 1 ? 's' : ''}`;
}

// Get day name from day number
function getDayName(dayNum) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum];
}

// Get short day name
function getShortDayName(dayNum) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayNum];
}
