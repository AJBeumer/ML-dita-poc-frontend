// src/fetchDita.js
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
});

export async function fetchEnvelope(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch envelope at ${url}`);
    }
    return response.json();
}

export async function fetchAndParseXML(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch XML at ${url}`);
    }
    const text = await response.text();
    return parser.parse(text);
}
