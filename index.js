let searchQuery = '';
let currentHighlight = -1;
let searchResults = [];

document.addEventListener('DOMContentLoaded', function() {
  // Auto-organize tabs when page loads
  autoOrganizeTabs();
  
  // Setup search functionality
  setupSearch();
});

// Setup search functionality
function setupSearch() {
  document.addEventListener('keydown', async (e) => {
    // Ignore if user is typing in an input field
    if (e.target.tagName === 'INPUT') return;
    
    if (e.key === 'Escape') {
      // Clear search
      searchQuery = '';
      currentHighlight = -1;
      searchResults = [];
      clearHighlights();
      return;
    }
    
    if (e.key === 'Enter' && searchResults.length > 0) {
      // Activate highlighted tab
      const tabId = searchResults[currentHighlight];
      await chrome.tabs.update(tabId, { active: true });
      window.close();
      return;
    }
    
    if (e.key === 'ArrowDown' && searchResults.length > 0) {
      e.preventDefault();
      currentHighlight = (currentHighlight + 1) % searchResults.length;
      highlightTab(searchResults[currentHighlight]);
      return;
    }
    
    if (e.key === 'ArrowUp' && searchResults.length > 0) {
      e.preventDefault();
      currentHighlight = (currentHighlight - 1 + searchResults.length) % searchResults.length;
      highlightTab(searchResults[currentHighlight]);
      return;
    }
    
    // Handle typing
    if (e.key.length === 1 || e.key === 'Backspace') {
      if (e.key === 'Backspace') {
        searchQuery = searchQuery.slice(0, -1);
      } else {
        searchQuery += e.key.toLowerCase();
      }
      
      await updateSearch();
    }
  });
}

// Update search results
async function updateSearch() {
  clearHighlights();
  
  if (!searchQuery) {
    currentHighlight = -1;
    searchResults = [];
    return;
  }
  
  const tabs = await chrome.tabs.query({});
  searchResults = tabs
    .filter(tab => {
      const title = tab.title.toLowerCase();
      const url = tab.url.toLowerCase();
      return title.includes(searchQuery) || url.includes(searchQuery);
    })
    .map(tab => tab.id);
  
  if (searchResults.length > 0) {
    currentHighlight = 0;
    highlightTab(searchResults[0]);
  }
}

// Clear all highlights
function clearHighlights() {
  document.querySelectorAll('.tab-item.highlight').forEach(el => {
    el.classList.remove('highlight');
  });
}

// Highlight a specific tab
function highlightTab(tabId) {
  clearHighlights();
  
  const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
  if (tabElement) {
    tabElement.classList.add('highlight');
    tabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Create a tab element
function createTabElement(tab, container) {
  const tabElement = document.createElement('div');
  tabElement.className = 'tab-item';
  tabElement.draggable = true;
  tabElement.dataset.tabId = tab.id;
  
  tabElement.innerHTML = `
    <img src="${tab.favIconUrl || '#'}" alt="favicon">
    <span class="title">${tab.title}</span>
    <button class="close">
      <svg viewBox="0 0 24 24" width="14" height="14">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
  `;
  
  setupTabElementListeners(tabElement, tab);
  container.appendChild(tabElement);
  return tabElement;
}

// Setup event listeners for the tab element
function setupTabElementListeners(tabElement, tab) {
  // Drag start
  tabElement.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', tab.id);
    e.dataTransfer.effectAllowed = 'move';
  });

  // Click anywhere on tab to activate
  tabElement.addEventListener('click', (e) => {
    // Don't activate if clicking the close button
    if (!e.target.closest('.close')) {
      chrome.tabs.update(tab.id, { active: true });
    }
  });

  // Close button
  tabElement.querySelector('.close').addEventListener('click', (e) => {
    e.stopPropagation();
    chrome.tabs.remove(tab.id);
    tabElement.remove();
  });
}

// Setup general event listeners
function setupEventListeners() {
  setupDragAndDrop();
}

// Setup drag and drop functionality
function setupDragAndDrop() {
  const dropZones = document.querySelectorAll('.stack-content');
  
  dropZones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      
      const tabId = parseInt(e.dataTransfer.getData('text/plain'));
      const tab = await chrome.tabs.get(tabId);
      
      // Create or get column based on domain
      const domain = new URL(tab.url).hostname;
      let column = findOrCreateColumn(zone, domain);
      
      // Move tab element to new column
      createTabElement(tab, column);
      
      // Remove from original location if it's a move operation
      const originalTab = document.querySelector(`[data-tab-id="${tabId}"]`);
      if (originalTab && originalTab.parentElement !== column) {
        originalTab.remove();
      }
    });
  });
}

// Find or create a column for a domain
function findOrCreateColumn(stack, domain) {
  let column = Array.from(stack.children).find(col => 
    col.dataset.domain === domain
  );
  
  if (!column) {
    column = document.createElement('div');
    column.className = 'column';
    column.dataset.domain = domain;
    column.innerHTML = `
      <div class="column-title">
        ${domain}
        <button class="close">×</button>
      </div>
      <div class="column-content"></div>
    `;
    
    // Add delete column functionality
    column.querySelector('.close').addEventListener('click', () => {
      const tabs = column.querySelectorAll('.tab-item');
      const mainColumn = document.getElementById('allTabs');
      tabs.forEach(tab => mainColumn.appendChild(tab.cloneNode(true)));
      column.remove();
    });
    
    stack.appendChild(column);
  }
  
  return column.querySelector('.column-content');
}

// Auto-organize functionality
async function autoOrganizeTabs() {
  const tabs = await chrome.tabs.query({});
  const domainTabs = new Map(); // Track tabs by domain
  const emptyTabs = []; // Track empty/new tabs
  
  // First, group all tabs by domain
  tabs.forEach(tab => {
    // Check if it's an empty/new tab
    if (tab.title === 'New Tab' || tab.title === '' || tab.url === 'chrome://newtab/') {
      emptyTabs.push(tab);
      return;
    }

    const domain = new URL(tab.url).hostname;
    if (!domainTabs.has(domain)) {
      domainTabs.set(domain, []);
    }
    domainTabs.get(domain).push(tab);
  });

  // Handle empty tabs - keep max 2, pin first one
  if (emptyTabs.length > 0) {
    // Keep first tab and pin it
    await chrome.tabs.update(emptyTabs[0].id, { pinned: true });
    
    // Position second tab next to the pinned one if it exists
    if (emptyTabs.length > 1) {
      await chrome.tabs.move(emptyTabs[1].id, { index: 1 });
    }
    
    // Remove any additional tabs beyond 2
    if (emptyTabs.length > 2) {
      const tabsToClose = emptyTabs.slice(2);
      await Promise.all(tabsToClose.map(tab => chrome.tabs.remove(tab.id)));
      emptyTabs.length = 2; // Keep only first two tabs
    }
  }

  // Clear all columns
  document.querySelectorAll('.stack-content').forEach(stack => {
    stack.innerHTML = '';
  });
  
  // Column 1: Single domain tabs and one empty tab
  const stack1 = document.querySelector('[data-stack="1"]');
  
  // Add single domain tabs
  const singleDomainTabs = [];
  domainTabs.forEach((tabs, domain) => {
    if (tabs.length === 1) {
      singleDomainTabs.push(...tabs);
    }
  });
  singleDomainTabs.forEach(tab => createTabElement(tab, stack1));
  
  // Add only one empty tab if exists
  if (emptyTabs.length > 0) {
    createTabElement(emptyTabs[0], stack1);
    
    // Close extra empty tabs
    if (emptyTabs.length > 1) {
      emptyTabs.slice(1).forEach(tab => {
        chrome.tabs.remove(tab.id);
      });
    }
  }
  
  // Get domains with multiple tabs
  const multiTabDomains = Array.from(domainTabs.entries())
    .filter(([_, tabs]) => tabs.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  // Get the columns for duplicate tabs
  const stack2 = document.querySelector('[data-stack="2"]');
  const stack3 = document.querySelector('[data-stack="3"]');
  const stack4 = document.querySelector('[data-stack="4"]');
  
  // Distribute domains with multiple tabs across columns 2, 3, and 4
  multiTabDomains.forEach(([domain, tabs], index) => {
    const targetColumn = index % 3 === 0 ? stack2 :
                        index % 3 === 1 ? stack3 : stack4;

    // Create a column for this domain
    const column = document.createElement('div');
    column.className = 'column';
    column.innerHTML = `<div class="column-title">${domain}</div>`;
    const content = document.createElement('div');
    content.className = 'column-content';
    column.appendChild(content);

    // Add all tabs for this domain
    tabs.forEach(tab => createTabElement(tab, content));

    targetColumn.appendChild(column);
  });


}
