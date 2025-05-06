// src/components/ContentPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { DitaNode } from './DitaRenderer';
import './ContentPage.css';

function ContentPage() {
    const { topicId } = useParams();
    const { topics } = useOutletContext();
    const [parsedDocs, setParsedDocs] = useState([]);
    const [error, setError] = useState(null);

    // Find node and its map-depth
    function findNodeDepth(list, uri, mapDepth = 0) {
        for (const t of list) {
            if (t.uri === uri) return { node: t, mapDepth };
            if (t.children) {
                const found = findNodeDepth(t.children, uri, mapDepth + 1);
                if (found) return found;
            }
        }
        return null;
    }

    // Collect subtree with relative depth
    function collectUriDepths(node, baseDepth = 0) {
        let arr = [{ uri: node.uri, depth: baseDepth }];
        (node.children || []).forEach(child => {
            arr = arr.concat(collectUriDepths(child, baseDepth + 1));
        });
        return arr;
    }

    useEffect(() => {
        if (!topicId || !topics) return;
        const decoded = decodeURIComponent(topicId);
        const normalized = decoded.startsWith('/') ? decoded : `/dita-xml/${decoded}`;

        const found = findNodeDepth(topics, normalized);
        if (!found) return;
        const { node } = found;

        // Depth 0: top-level only; Depth >=1: include entire subtree
        const uriDepths = (found.mapDepth === 0)
            ? [{ uri: node.uri, depth: 0 }]
            : collectUriDepths(node, 0);

        Promise.all(
            uriDepths.map(({ uri, depth }) =>
                fetch(`http://localhost:3001/api/dita-xml?uri=${encodeURIComponent(uri)}`)
                    .then(res => {
                        if (!res.ok) throw new Error(res.statusText);
                        return res.json();
                    })
                    .then(json => ({ uri, json, depth }))
            )
        )
            .then(results => setParsedDocs(results))
            .catch(err => setError(err));
    }, [topicId, topics]);

    if (error) return <div className="cp-error">Error: {error.message}</div>;
    if (!parsedDocs.length) return <div className="cp-loading">Loading content...</div>;

    return (
        <div className="content-container">
            {parsedDocs.map(({ uri, json, depth }) => {
                const root = json.topic || json.concept || json.task || json.reference || json.glossgroup || {};
                const title = typeof root.title === 'object' && root.title['#text']
                    ? root.title['#text']
                    : root.title || 'No Title';
                const body = root.body || root.conbody;

                // Dynamic heading tag and class
                const Heading = `h${Math.min(depth + 1, 4)}`;
                return (
                    <section id={uri} key={uri} className={`cp-section cp-depth-${depth}`}>
                        {React.createElement(
                            Heading,
                            { className: `cp-heading cp-level-${depth}` },
                            title
                        )}
                        {body ? <DitaNode node={body} /> : <p className="cp-empty">No content.</p>}
                    </section>
                );
            })}
        </div>
    );
}

export default ContentPage;