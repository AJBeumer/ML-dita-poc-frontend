// src/components/ContentPage.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DitaNode } from './DitaRenderer';
import '../App.css';  // Assuming your CSS is here // Assuming your CSS is here

function ContentPage() {
    const { topicId } = useParams(); // Should be "/dita-xml/sample.xml"
    const [parsedXml, setParsedXml] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!topicId) {
            console.error("ContentPage: No topicId provided in URL parameters.");
            return;
        }
        // topicId should already start with a slash; if not, normalize.
        const normalizedTopicId = topicId.startsWith('/') ? topicId : `/dita-xml/${topicId}`;
        const apiUrl = `http://localhost:3001/api/dita-xml?uri=${encodeURIComponent(normalizedTopicId)}`;
        console.log('ContentPage - Fetching from:', apiUrl);
        fetch(apiUrl)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                console.log('ContentPage - Fetched data:', data);
                setParsedXml(data);
            })
            .catch(err => {
                console.error('Error fetching topic from Node API:', err);
                setError(err);
            });
    }, [topicId]);

    if (error) {
        return <div>Error: {error.message}</div>;
    }
    if (!parsedXml) return <div>Loading content...</div>;

    const root =
        parsedXml.topic ||
        parsedXml.concept ||
        parsedXml.task ||
        parsedXml.reference ||
        parsedXml.glossgroup ||
        {};
    let title = 'No Title';
    if (root.title) {
        title =
            typeof root.title === 'object' && root.title['#text']
                ? root.title['#text']
                : root.title;
    }
    const body = root.body || root.conbody;

    return (
        <div style={{ padding: '1rem' }}>
            <h1>{title}</h1>
            {body ? <DitaNode node={body} /> : <div>No body content found.</div>}
        </div>
    );
}

export default ContentPage;
