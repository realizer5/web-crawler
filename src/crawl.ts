import { URL } from "node:url";
import { JSDOM } from "jsdom";

function normalizeURL(url: string): string {
    try {
        const urlObj = new URL(url);
        const result = urlObj.host + urlObj.pathname;
        if (result.slice(-1) === "/") {
            return result.slice(0, -1);
        }
        return result;
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error normalizing URL: ${url}`, error.message);
        } else {
            console.error(`Error normalizing URL: ${url}`, error);
        }
        return "";
    }
}

function getH1FromHTML(html: string): string {
    const dom = new JSDOM(html);
    const headingText = dom.window.document
        .querySelector("h1")
        ?.textContent.trim();
    if (headingText) {
        return headingText;
    }
    return "";
}

function getFirstParagraphFromHTML(html: string): string {
    const dom = new JSDOM(html);
    const getFirstValidParagraph = (container: Element | null): string => {
        if (!container) return "";
        for (const p of container.querySelectorAll("p")) {
            p.querySelectorAll("style, script").forEach((el) => el.remove());
            const text = p.textContent?.trim();
            if (text) return text;
            p.remove();
        }
        return "";
    };
    const main = dom.window.document.querySelector("main");
    const body = dom.window.document.querySelector("body");
    return getFirstValidParagraph(main) || getFirstValidParagraph(body);
}

function getURLsFromHTML(html: string, baseURL: string): string[] {
    const urls: string[] = [];
    const dom = new JSDOM(html);
    const linkElements = dom.window.document.querySelectorAll("a");
    for (const linkElement of linkElements) {
        try {
            const href = linkElement.getAttribute("href");
            if (!href || href.startsWith("javascript:")) continue;
            const urlObj = new URL(href, baseURL);
            const url = urlObj.href.endsWith("/")
                ? urlObj.href.slice(0, -1)
                : urlObj.href;
            if (urls.includes(url)) continue;
            urls.push(url);
        } catch (error) {
            console.warn(`error with getting url: ${error}`);
        }
    }
    return urls;
}

function filterURLs(urls: string[], baseURL: string) {
    const internal_links: string[] = [];
    const external_links: string[] = [];
    urls.forEach((link) => {
        if (link.startsWith(baseURL)) {
            internal_links.push(link);
        } else {
            external_links.push(link);
        }
    });
    return {
        internal_links,
        external_links,
        internal_links_count: internal_links.length,
        external_links_count: external_links.length,
    };
}

function getImagesFromHTML(html: string, baseURL: string): string[] {
    const images: string[] = [];
    const dom = new JSDOM(html);
    const imgElements = dom.window.document.querySelectorAll("img");
    for (const imgElement of imgElements) {
        const src = imgElement.getAttribute("src");
        if (!src) continue;
        const urlObj = new URL(src, baseURL);
        const url = urlObj.href.endsWith("/")
            ? urlObj.href.slice(0, -1)
            : urlObj.href;
        if (images.includes(url)) continue;
        images.push(url);
    }
    return images;
}

export type ExtractedPageData = {
    url: string;
    heading: string;
    first_paragraph: string;
    internal_links: string[];
    external_links: string[];
    internal_links_count: number;
    external_links_count: number;
    image_urls: string[];
};

function extractPageData(
    html: string,
    baseURL: string,
    currentURl: string,
): ExtractedPageData {
    const url = currentURl;
    const heading = getH1FromHTML(html);
    const first_paragraph = getFirstParagraphFromHTML(html);
    const outgoing_links = getURLsFromHTML(html, baseURL);
    const {
        internal_links,
        external_links,
        internal_links_count,
        external_links_count,
    } = filterURLs(outgoing_links, baseURL);
    const image_urls = getImagesFromHTML(html, baseURL);
    return {
        url,
        heading,
        first_paragraph,
        internal_links,
        external_links,
        internal_links_count,
        external_links_count,
        image_urls,
    };
}

export {
    normalizeURL,
    getH1FromHTML,
    getFirstParagraphFromHTML,
    getURLsFromHTML,
    filterURLs,
    getImagesFromHTML,
    extractPageData,
};
