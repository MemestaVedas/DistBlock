// Storage utilities for DistBlock extension

const StorageKeys = {
  BLOCKED_SITES: 'blockedSites',
  TIME_SCHEDULES: 'timeSchedules',
  ENABLED: 'enabled',
  THEME: 'theme'
};

// Default data structure
const defaultData = {
  blockedSites: [],
  timeSchedules: [],
  enabled: true,
  theme: 'expressive'
};

// Get all blocked sites
async function getBlockedSites() {
  const result = await browser.storage.local.get(StorageKeys.BLOCKED_SITES);
  return result.blockedSites || [];
}

// Set blocked sites
async function setBlockedSites(sites) {
  await browser.storage.local.set({ [StorageKeys.BLOCKED_SITES]: sites });
}

// Add a blocked site
async function addBlockedSite(site) {
  const sites = await getBlockedSites();
  if (!sites.find(s => s.url === site.url)) {
    sites.push(site);
    await setBlockedSites(sites);
  }
  return sites;
}

// Remove a blocked site
async function removeBlockedSite(url) {
  const sites = await getBlockedSites();
  const filtered = sites.filter(s => s.url !== url);
  await setBlockedSites(filtered);
  return filtered;
}

// Get all time schedules
async function getTimeSchedules() {
  const result = await browser.storage.local.get(StorageKeys.TIME_SCHEDULES);
  return result.timeSchedules || [];
}

// Set time schedules
async function setTimeSchedules(schedules) {
  await browser.storage.local.set({ [StorageKeys.TIME_SCHEDULES]: schedules });
}

// Add a time schedule
async function addTimeSchedule(schedule) {
  const schedules = await getTimeSchedules();
  schedules.push({
    id: Date.now().toString(),
    ...schedule
  });
  await setTimeSchedules(schedules);
  return schedules;
}

// Remove a time schedule
async function removeTimeSchedule(id) {
  const schedules = await getTimeSchedules();
  const filtered = schedules.filter(s => s.id !== id);
  await setTimeSchedules(filtered);
  return filtered;
}

// Get enabled status
async function getEnabled() {
  const result = await browser.storage.local.get(StorageKeys.ENABLED);
  return result.enabled !== undefined ? result.enabled : true;
}

// Set enabled status
async function setEnabled(enabled) {
  await browser.storage.local.set({ [StorageKeys.ENABLED]: enabled });
}

// Get theme
async function getTheme() {
  const result = await browser.storage.local.get(StorageKeys.THEME);
  return result.theme || 'expressive';
}

// Set theme
async function setTheme(theme) {
  await browser.storage.local.set({ [StorageKeys.THEME]: theme });
}

// Initialize storage with defaults if empty
async function initializeStorage() {
  const result = await browser.storage.local.get(null);
  if (Object.keys(result).length === 0) {
    await browser.storage.local.set(defaultData);
  }
}
