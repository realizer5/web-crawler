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

function removeTrailingSlash(url: string): string {
    try {
        const urlObj = new URL(url);
        const result = urlObj.href;
        return result.endsWith("/") ? result.slice(0, -1) : result;
    } catch (error) {
        if (error instanceof Error) {
            console.error(
                `Error removing trailing slash in URL: ${url}`,
                error.message,
            );
        } else {
            console.error(
                `Error removing trailing slash in URL: ${url}`,
                error,
            );
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
            const url = removeTrailingSlash(urlObj.href);
            if (urls.includes(url)) continue;
            urls.push(url);
        } catch (error) {
            console.warn(`error with getting url: ${error}`);
        }
    }
    return urls;
}

function getImagesFromHTML(html: string, baseURL: string): string[] {
    const images: string[] = [];
    const dom = new JSDOM(html);
    const imgElements = dom.window.document.querySelectorAll("img");
    for (const imgElement of imgElements) {
        const src = imgElement.getAttribute("src");
        if (!src) continue;
        const urlObj = new URL(src, baseURL);
        const url = removeTrailingSlash(urlObj.href);
        if (images.includes(url)) continue;
        images.push(url);
    }
    return images;
}

export type ExtractedPageData = {
    url: string;
    heading: string;
    first_paragraph: string;
    outgoing_links: string[];
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
    const image_urls = getImagesFromHTML(html, baseURL);
    return { url, heading, first_paragraph, outgoing_links, image_urls };
}
export {
    normalizeURL,
    removeTrailingSlash,
    getH1FromHTML,
    getFirstParagraphFromHTML,
    getURLsFromHTML,
    getImagesFromHTML,
    extractPageData,
};
