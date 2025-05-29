# Tab Stack Manager

A Chrome extension that helps you organize your tabs into meaningful columns based on domains and duplicates.

## Features

- **Automatic Tab Organization**: Automatically organizes your tabs when you open a new tab
- **Smart Column Layout**: 
  - Column 1: Single Domain Tabs
    - Shows tabs from domains that appear only once
  - Columns 2-4: Multiple Domain Tabs
    - Shows grouped tabs from domains that have multiple tabs
    - Domains with more tabs appear first
    - Each domain gets its own section with a clear header

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the folder containing this extension

## How It Works

When you open a new tab, the extension will automatically organize your tabs into four columns:

1. **Single Domain Column** (First Column):
   - Contains tabs from domains that appear only once
   - Example: If you have only one tab from `github.com`, it will appear here

2. **Multiple Domain Columns** (Columns 2-4):
   - Contains tabs from domains that have multiple tabs
   - Tabs are grouped by their domain
   - Each domain gets its own section with a header
   - Example: If you have multiple tabs from `example.com`, they'll be grouped together in one of these columns

### Example Organization

If you have these tabs:
```
example.com/page1
example.com/page2
github.com/repo1
pubmatic.com/page1
pubmatic.com/page2
pubmatic.com/page3
stackoverflow.com/q1
```

They will be organized as:
- Column 1 (Single Domain):
  - github.com/repo1
  - stackoverflow.com/q1
- Column 2 (Multiple Domains):
  - pubmatic.com (3 tabs)
- Column 3 (Multiple Domains):
  - example.com (2 tabs)
- Column 4 (Multiple Domains):
  - (empty in this case)

## Features

- Drag and drop tabs between columns
- Click on a tab to activate it
- Clean, modern interface
- Automatic organization on page load
- Visual grouping by domain

## Browser Support

- Chrome (latest version)

## License

MIT License
