// Background script for DistBlock extension
// Handles website blocking logic

// Initialize storage on install
browser.runtime.onInstalled.addListener(async () => {
    await initializeStorage();
    console.log('DistBlock extension installed');
});

// Listen for web requests
browser.webRequest.onBeforeRequest.addListener(
    async (details) => {
        // Don't block extension pages
        if (details.url.startsWith('moz-extension://')) {
            return {};
        }

        // Check if blocking is enabled
        const enabled = await getEnabled();
        if (!enabled) {
            return {};
        }

        // Get schedules
        const schedules = await getTimeSchedules();

        // Check if URL should be blocked
        const shouldBlock = await shouldBlockUrl(details.url, schedules);

        if (shouldBlock) {
            // Find which schedule is blocking this URL
            const activeSchedule = schedules.find(schedule => {
                if (!schedule.enabled || !isTimeInSchedule(schedule)) {
                    return false;
                }
                return schedule.urls.some(pattern => urlMatchesPattern(details.url, pattern));
            });

            // Redirect to blocked page with information
            const blockedUrl = browser.runtime.getURL('blocked/blocked.html') +
                '?url=' + encodeURIComponent(details.url) +
                '&schedule=' + encodeURIComponent(JSON.stringify(activeSchedule));

            return { redirectUrl: blockedUrl };
        }

        return {};
    },
    { urls: ['<all_urls>'], types: ['main_frame'] },
    ['blocking']
);

// Listen for messages from popup/options
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    switch (message.action) {
        case 'getStatus':
            const enabled = await getEnabled();
            const schedules = await getTimeSchedules();
            const sites = await getBlockedSites();
            return {
                enabled,
                schedules,
                sites,
                activeSchedules: schedules.filter(s => s.enabled && isTimeInSchedule(s))
            };

        case 'toggleEnabled':
            const newState = await getEnabled();
            await setEnabled(!newState);
            return { enabled: !newState };

        case 'checkUrl':
            const schedules2 = await getTimeSchedules();
            const shouldBlock2 = await shouldBlockUrl(message.url, schedules2);
            return { blocked: shouldBlock2 };

        default:
            return {};
    }
});

// Update badge to show blocking status
async function updateBadge() {
    const enabled = await getEnabled();
    const schedules = await getTimeSchedules();
    const activeSchedules = schedules.filter(s => s.enabled && isTimeInSchedule(s));

    if (!enabled) {
        browser.browserAction.setBadgeText({ text: '' });
        browser.browserAction.setBadgeBackgroundColor({ color: '#666' });
    } else if (activeSchedules.length > 0) {
        browser.browserAction.setBadgeText({ text: activeSchedules.length.toString() });
        browser.browserAction.setBadgeBackgroundColor({ color: '#6750A4' });
    } else {
        browser.browserAction.setBadgeText({ text: '✓' });
        browser.browserAction.setBadgeBackgroundColor({ color: '#00897B' });
    }
}

// Update badge every minute
setInterval(updateBadge, 60000);
updateBadge();
