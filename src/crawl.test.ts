import {
    extractPageData,
    getFirstParagraphFromHTML,
    getH1FromHTML,
    getImagesFromHTML,
    getURLsFromHTML,
    normalizeURL,
} from "./crawl";
import { describe, expect, it, test } from "vitest";

describe("normalizeURL", () => {
    const expected = "blog.boot.dev/path";
    it("removes trailing slash", () => {
        const input = "https://blog.boot.dev/path/";
        const actual = normalizeURL(input);
        expect(actual).toEqual(expected);
    });
    it("keeps path without slash", () => {
        const input = "https://blog.boot.dev/path";
        const actual = normalizeURL(input);
        expect(actual).toEqual(expected);
    });
    it("removes trailing slash", () => {
        const input = "https://blog.boot.dev/path/";
        const actual = normalizeURL(input);
        expect(actual).toEqual(expected);
    });
    it("strips protocol", () => {
        const input = "https://blog.boot.dev/path/";
        const actual = normalizeURL(input);
        expect(actual).toEqual(expected);
    });
});

describe("getH1FromHTML", () => {
    const expected = "Test Title";
    it("returns h1 text", () => {
        const input = `<html><body><h1>Test Title</h1></body></html>`;
        const actual = getH1FromHTML(input);
        expect(actual).toEqual(expected);
    });

    it("trims whitespace", () => {
        const input = `<html><body><h1> Test Title </h1></body></html>`;
        const actual = getH1FromHTML(input);
        expect(actual).toEqual(expected);
    });

    it("returns empty string when no h1", () => {
        const input = `<html><body><p>No Heading Here.</p></body></html>`;
        const actual = getH1FromHTML(input);
        const expected = "";
        expect(actual).toEqual(expected);
    });

    it("handles nested tags inside h1", () => {
        const input = `<html><body><h1><span>Test</span> Title</h1></body></html>`;
        const actual = getH1FromHTML(input);
        expect(actual).toEqual(expected);
    });

    it("returns first h1 when multiple exist", () => {
        const input = `<html><body><h1>Test Title</h1><h1>Test Title 2</h1></body></html>`;
        const actual = getH1FromHTML(input);
        expect(actual).toEqual(expected);
    });
});

describe("getFirstParagraphFromHTML", () => {
    const expected = "Main Paragraph";
    it("returns first paragraph text", () => {
        const input = `<html><body><p>Main Paragraph</p></body></html>`;
        const actual = getFirstParagraphFromHTML(input);
        expect(actual).toEqual(expected);
    });

    it("prefers paragraph inside main over body", () => {
        const input = `<html><body><p>Outside Main Paragraph</p><main><p>Main Paragraph</p></main></body></html>`;
        const actual = getFirstParagraphFromHTML(input);
        expect(actual).toEqual(expected);
    });

    it("falls back to body when main is empty", () => {
        const input = `<html><body><main></main><p>Main Paragraph</p></body></html>`;
        const actual = getFirstParagraphFromHTML(input);
        expect(actual).toEqual(expected);
    });

    it("skips empty paragraphs", () => {
        const input = `<html><body><p></p><p>   </p><main><p>Main Paragraph</p></main></body></html>`;
        const actual = getFirstParagraphFromHTML(input);
        expect(actual).toEqual(expected);
    });

    it("strips style tags inside paragraph", () => {
        const input = `<html><body><p><style>.foo { color: red }</style>Main Paragraph</p></body></html>`;
        const actual = getFirstParagraphFromHTML(input);
        expect(actual).toEqual(expected);
    });

    it("strips script tags inside paragraph", () => {
        const input = `<html><body><p><script>alert(1)</script>Main Paragraph</p></body></html>`;
        const actual = getFirstParagraphFromHTML(input);
        expect(actual).toEqual(expected);
    });

    it("returns empty string when no paragraphs exist", () => {
        const input = `<html><body></body></html>`;
        const actual = getFirstParagraphFromHTML(input);
        const expected = "";
        expect(actual).toEqual(expected);
    });

    it("returns empty string for empty html", () => {
        const input = ``;
        const actual = getFirstParagraphFromHTML(input);
        const expected = "";
        expect(actual).toEqual(expected);
    });
});

describe("getURLsFromHTML", () => {
    const baseURL = "https://blog.boot.dev";
    const expected = "https://blog.boot.dev/about";

    it("returns absolute urls", () => {
        const input = `<a href="https://blog.boot.dev/about">About</a>`;
        const actual = getURLsFromHTML(input, baseURL);
        expect(actual).toContain(expected);
    });

    it("resolves relative urls against base", () => {
        const input = `<a href="/about">About</a>`;
        const actual = getURLsFromHTML(input, baseURL);
        expect(actual).toContain(expected);
    });

    it("deduplicates urls", () => {
        const input = `<a href="/about">About</a><a href="/about">About again</a>`;
        const actual = getURLsFromHTML(input, baseURL);
        expect(actual).toHaveLength(1);
    });

    it("skips javascript:void(0) links", () => {
        const input = `<a href="javascript:void(0)">Click</a>`;
        const actual = getURLsFromHTML(input, baseURL);
        expect(actual).toHaveLength(0);
    });

    it("skips anchors with no href", () => {
        const input = `<a>No href</a>`;
        const actual = getURLsFromHTML(input, baseURL);
        expect(actual).toHaveLength(0);
    });

    it("removes trailing slashes from urls", () => {
        const input = `<a href="https://blog.boot.dev/about/">About</a>`;
        const actual = getURLsFromHTML(input, baseURL);
        expect(actual).toContain(expected);
    });

    it("returns empty array when no links", () => {
        const input = `<html><body><p>no links</p></body></htm>`;
        const actual = getURLsFromHTML(input, baseURL);
        expect(actual).toEqual([]);
    });
});

describe("getImagesFromHTML", () => {
    const baseURL = "https://blog.boot.dev";
    const expected = "https://blog.boot.dev/img/photo.jpg";

    it("returns absolute image urls", () => {
        const input = `<img src="https://blog.boot.dev/img/photo.jpg" />`;
        const actual = getImagesFromHTML(input, baseURL);
        expect(actual).toContain(expected);
    });

    it("resolves relative image src against base", () => {
        const input = `<img src="/img/photo.jpg" />`;
        const actual = getImagesFromHTML(input, baseURL);
        expect(actual).toContain(expected);
    });

    it("skips images with no src attribute", () => {
        const input = `<img alt="no src" />`;
        const actual = getImagesFromHTML(input, baseURL);
        expect(actual).toHaveLength(0);
    });

    it("deduplicates image urls", () => {
        const input = `<img src="/img/photo.jpg" /> <img src="/img/photo.jpg" />`;
        const actual = getImagesFromHTML(input, baseURL);
        expect(actual).toHaveLength(1);
    });

    it("returns empty array when no images", () => {
        const input = "<p>no images</p>";
        const actual = getImagesFromHTML(input, baseURL);
        expect(actual).toEqual([]);
    });
});

test("extractPageData basic", () => {
    const inputURL = "https://blog.boot.dev";
    const inputBody = `
    <html><body>
      <h1>Test Title</h1>
      <p>This is the first paragraph.</p>
      <a href="/link1">Link 1</a>
      <img src="/image1.jpg" alt="Image 1">
    </body></html>
  `;

    const actual = extractPageData(inputBody, inputURL, inputURL);
    const expected = {
        url: "https://blog.boot.dev",
        heading: "Test Title",
        first_paragraph: "This is the first paragraph.",
        internal_links: ["https://blog.boot.dev/link1"],
        external_links: [],
        internal_links_count: 1,
        external_links_count: 0,
        image_urls: ["https://blog.boot.dev/image1.jpg"],
    };

    expect(actual).toEqual(expected);
});

describe("extractPageData", () => {
    const baseURL = "https://blog.boot.dev";
    const currentURL = "https://blog.boot.dev/about";

    it("returns correct url", () => {
        const { url } = extractPageData("<html></html>", baseURL, currentURL);
        expect(url).toBe(currentURL);
    });

    it("extracts heading", () => {
        const html = `<h1>About Us</h1>`;
        const { heading } = extractPageData(html, baseURL, currentURL);
        expect(heading).toBe("About Us");
    });

    it("extracts first paragraph", () => {
        const html = `<p>Welcome to our site</p>`;
        const { first_paragraph } = extractPageData(html, baseURL, currentURL);
        const expected = "Welcome to our site";
        expect(first_paragraph).toBe(expected);
    });

    it("extracts outgoing links", () => {
        const html = `<a href="/posts">Posts</a>`;
        const { internal_links } = extractPageData(html, baseURL, currentURL);
        const expected = "https://blog.boot.dev/posts";
        expect(internal_links).toContain(expected);
    });

    it("extracts image urls", () => {
        const html = `<img src="/img/photo.jpg" />`;
        const { image_urls } = extractPageData(html, baseURL, currentURL);
        const expected = "https://blog.boot.dev/img/photo.jpg";
        expect(image_urls).toContain(expected);
    });

    it("returns empty strings when no heading or paragraph", () => {
        const html = "<div>nothing</div>";
        const { heading, first_paragraph } = extractPageData(
            html,
            baseURL,
            currentURL,
        );
        const expected = "";
        expect(heading).toBe(expected);
        expect(first_paragraph).toBe(expected);
    });

    it("returns empty arrays when no links or images", () => {
        const html = "<div>nothing</div>";
        const { internal_links, image_urls } = extractPageData(
            html,
            baseURL,
            currentURL,
        );
        const expected: string[] = [];
        expect(internal_links).toEqual(expected);
        expect(image_urls).toEqual(expected);
    });

    it("returns correct shape", () => {
        const html = "<html><body></body></html>";
        const data = extractPageData(html, baseURL, currentURL);
        expect(data).toHaveProperty("url");
        expect(data).toHaveProperty("heading");
        expect(data).toHaveProperty("first_paragraph");
        expect(data).toHaveProperty("internal_links");
        expect(data).toHaveProperty("external_links");
        expect(data).toHaveProperty("internal_links_count");
        expect(data).toHaveProperty("external_links_count");
        expect(data).toHaveProperty("image_urls");
    });

    it("handles a full page correctly", () => {
        const html = `
            <html>
                <body>
                    <h1>About Us</h1>
                    <main>
                        <p>Welcome to our site</p>
                        <a href="/about">About</a>
                    </main>
                    <img src="/img/photo.jpg" />
                </body>
            </html>`;
        const actual = extractPageData(html, baseURL, currentURL);
        const expected = {
            url: currentURL,
            heading: "About Us",
            first_paragraph: "Welcome to our site",
            internal_links: [currentURL],
            external_links: [],
            internal_links_count: 1,
            external_links_count: 0,
            image_urls: ["https://blog.boot.dev/img/photo.jpg"],
        };
        expect(actual).toEqual(expected);
    });
});
