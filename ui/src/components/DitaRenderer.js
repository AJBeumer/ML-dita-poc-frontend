// src/components/DitaRenderer.js
import React from 'react';

const ELEMENT_MAP = {
    p: 'p',
    fn: 'aside',
    title: 'h3',
    fig: 'figure',
    table: 'table',
    tgroup: 'tbody',
    row: 'tr',
    entry: 'td',
    ol: 'ol',
    li: 'li',
    xref: 'href'

};

export function renderDitaNode(node, key) {
    if (typeof node === 'string') {
        return node;
    }
    if (!node || typeof node !== 'object') {
        return null;
    }
    const children = [];
    const attributes = {};

    for (const propName of Object.keys(node)) {
        if (propName === '#text') {
            children.push(node['#text']);
        } else if (propName.startsWith('@_')) {
            const attrName = propName.substring(2);
            attributes[attrName] = node[propName];
        } else {
            const subNode = node[propName];
            if (Array.isArray(subNode)) {
                subNode.forEach((item, idx) => {
                    children.push(renderDitaElement(propName, item, `${propName}-${idx}`));
                });
            } else {
                children.push(renderDitaElement(propName, subNode, propName));
            }
        }
    }
    return <>{children}</>;
}

function renderDitaElement(tagName, node, key) {
    if (tagName === 'image') {
        let imgHref = node['@_href'] || '';
        // Normalize: if it doesn't start with '/', assume it's in the dita-images collection.
        if (!imgHref.startsWith('/')) {
            imgHref = `/dita-images/${imgHref}`;
        }
        // Use the full Node middle-tier URL so the image is fetched from the correct host.
        const NODE_BASE_URL = 'http://localhost:3001';
        const src = `${NODE_BASE_URL}/api/dita-image?uri=${encodeURIComponent(imgHref)}`;
        const altText = node['@_alt'] || '';
        return <img key={key} src={src} alt={altText} />;
    }

    const htmlTag = ELEMENT_MAP[tagName] || 'div';
    const renderedChildren = renderDitaNode(node, `${key}-content`);
    return React.createElement(htmlTag, { key }, renderedChildren);
}

export function DitaNode({ node }) {
    return <>{renderDitaNode(node)}</>;
}
