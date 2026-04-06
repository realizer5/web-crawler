import { argv } from "node:process";
import {
    ExtractedPageData,
    extractPageData,
    normalizeURL,
    removeTrailingSlash,
} from "./crawl";
import pLimit from "p-limit";
import { writeJSONReport } from "./report";
import { createGraph } from "./graph";

class ConcurrentCrawler {
    public pages: Record<string, ExtractedPageData> = {};
    private shouldStop: boolean = false;
    private visitedURLs: Set<string> = new Set();
    constructor(
        private baseURL: string,
        private limit: <T>(fn: () => Promise<T>) => Promise<T>,
        private maxPages: number,
    ) {}
    private canVisit(normalizedURL: string): boolean {
        if (this.shouldStop) return false;
        if (this.visitedURLs.has(normalizedURL)) return false;
        if (this.visitedURLs.size >= this.maxPages) {
            this.shouldStop = true;
            console.log("Reached maximum number of pages to crawl.");
            return false;
        }
        return true;
    }
    private async getHTML(currentURL: string): Promise<string> {
        return await this.limit(async () => {
            try {
                const res = await fetch(currentURL, {
                    headers: { Accept: "text/html", "User-Agent": "seekr/1.0" },
                });
                if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
                const contentType = res.headers.get("content-type");
                if (!contentType?.includes("text/html"))
                    throw new Error(`Expected HTML but got ${contentType}`);
                return await res.text();
            } catch (error) {
                console.error(`Error getting HTML from ${currentURL}`, error);
                return "";
            }
        });
    }
    private async crawlPage(currentURL: string): Promise<void> {
        if (this.shouldStop) return;
        if (!currentURL.startsWith(this.baseURL)) return;
        const normalizedURL = normalizeURL(currentURL);
        if (!this.canVisit(normalizedURL)) return;
        this.visitedURLs.add(normalizedURL);
        console.log(`Starting crawl on ${normalizedURL}`);
        try {
            const html = await this.getHTML(currentURL);
            if (!html) throw new Error(`Error getting html`);
            const data = extractPageData(html, this.baseURL, currentURL);
            this.pages[normalizedURL] = data;
            await Promise.all(
                data.outgoing_links.map((url) => this.crawlPage(url)),
            );
        } catch (error) {
            console.error(`Error crawling ${currentURL}:`, error);
        }
    }
    async crawl(): Promise<Record<string, ExtractedPageData>> {
        await this.crawlPage(this.baseURL);
        return this.pages;
    }
}

async function main() {
    if (argv.length < 3) {
        console.error("Error: You must provide exactly one URL to scrape.");
        console.info("usage: npm run start <URL> <maxConcurrency> <maxPages>");
        process.exit(1);
    }
    const maxConcurrency = Number(argv[3]) || 5;
    const maxPages = Number(argv[4]) || 50;
    console.time("crawl");
    try {
        const url = removeTrailingSlash(argv[2]);
        const pages = await crawlSiteAsync(url, maxConcurrency, maxPages);
        console.log("Finished crawling.");
        const firstPage = Object.values(pages)[0];
        if (firstPage) {
            console.log(
                `First page record: ${firstPage["url"]} - ${firstPage["heading"]}`,
            );
        }
        writeJSONReport(pages, "report.json");
        await createGraph(pages);
    } catch (error) {
        if (error instanceof Error) {
            console.error("Crawler failed: ", error.message);
        } else {
            console.error("Crawler failed: ", error);
        }
        process.exit(1);
    }
    console.timeEnd("crawl");
    process.exit(0);
}

main();

async function crawlSiteAsync(
    baseURL: string,
    maxConcurrency: number,
    maxPages: number,
) {
    const crawler = new ConcurrentCrawler(
        baseURL,
        pLimit(maxConcurrency),
        maxPages,
    );
    await crawler.crawl();
    return crawler.pages;
}
