import { writeFileSync } from "node:fs";
import { ExtractedPageData } from "./crawl";
import { Graphviz } from "@hpcc-js/wasm-graphviz";

export async function createGraph(pageData: Record<string, ExtractedPageData>) {
    const adjacencyList = new Map<string, string[]>();
    const pages = Object.values(pageData);
    // nodes
    for (const page of pages) {
        adjacencyList.set(page.url, []);
    }
    // edges
    for (const page of pages) {
        adjacencyList.set(
            page.url,
            page.internal_links.filter(
                (link: string) => link !== page.url && adjacencyList.has(link),
            ),
        );
    }
    const g = await Graphviz.load();
    let dot = `
    digraph G {
    bgcolor="#0f172a";
    splines=true;
    rankdir="LR";
  node [
    shape=box,
    style="rounded,filled",
    fillcolor="#1e293b",
    fontcolor="#e2e8f0",
    color="#334155",
    margin=0.2
  ];
  edge [
    color="#64748b",
    penwidth=1.5,
    arrowsize=0.8
  ];
`;
    for (const [src, links] of adjacencyList.entries()) {
        for (const dest of links) {
            dot += ` "${src}" -> "${dest}";\n`;
        }
    }
    dot += "}\n";
    const svg = g.dot(dot);
    writeFileSync("graph.svg", svg);
}
