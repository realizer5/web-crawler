# 🔎 Seekr — Web Crawler CLI

Seekr is a fast and minimal command-line web crawler built with **TypeScript**.
It allows you to crawl websites with configurable concurrency and page limits, and generates a structured report after execution.

---

## ✨ Features

- 🌐 Crawl websites from a starting URL
- ⚡ Configurable concurrency for faster crawling
- 📄 Limit number of pages to crawl
- 📊 Generates `report.json` with crawl results
- 🧪 Includes tests for core functions
- 🧱 Built with TypeScript for reliability

---

## 🚀 Tech Stack

- **TypeScript**
- **Node.js / npm**

---

## 📦 Installation

```bash
git clone https://github.com/your-username/seekr.git
cd seekr
npm install
```

### Usage
Run crawler using
```bash
npm start <url> <concurrency> <maxPages>
```

Example:
```bash
npm start https://example.org 3 10
```

`<url>` → Starting URL to crawl
`<concurrency>` → Number of parallel requests
`<maxPages>` → Maximum pages to crawl

### Output
After crawling, Seekr generates `report.json`
