// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Notify popup if it's open
    chrome.runtime.sendMessage({
      type: 'tabUpdated',
      tab: tab
    });
  }
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  // Notify popup if it's open
  chrome.runtime.sendMessage({
    type: 'tabRemoved',
    tabId: tabId
  });
});

// Listen for new tabs
chrome.tabs.onCreated.addListener((tab) => {
  // Notify popup if it's open
  chrome.runtime.sendMessage({
    type: 'tabCreated',
    tab: tab
  });
});
