


export function createPageUrl(pageName: string) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

export function getDescriptionPreviewText(description?: string): string {
    if (!description || typeof description !== "string") {
        return "";
    }

    return description
        // Remove markdown headings like ## Title.
        .replace(/^\s{0,3}#{1,6}\s+/gm, "")
        // Remove bullet and ordered list markers.
        .replace(/^\s*([-*+]|\d+\.)\s+/gm, "")
        // Strip inline markdown tokens while preserving readable text.
        .replace(/(\*\*|__|\*|_|~~|`)/g, "")
        // Convert markdown links [label](url) to just "label".
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
        // Flatten whitespace and line breaks.
        .replace(/\s*\n+\s*/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
}