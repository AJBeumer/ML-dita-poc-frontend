import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAndParseXML } from '../fetchDita';
import LeftMenu from './LeftMenu';

// This page is responsible for showing a left-hand menu
// plus the content of the selected topic.

function ContentPage() {
    const { topicId } = useParams();
    // topicId might be the encoded URI like "/dita-xml/clog.xml"
    const [parsedXml, setParsedXml] = useState(null);

    useEffect(() => {
        // fetch the actual file
        const path = decodeURIComponent(topicId).replace(/^\/dita-xml/, '');
        fetchAndParseXML('/data' + path)
            .then(data => {
                setParsedXml(data);
            })
            .catch(err => console.error('Error loading or parsing topic', err));
    }, [topicId]);

    // We'll just display basic elements (title, paragraphs, etc.)
    if (!parsedXml) {
        return <div>Loading...</div>;
    }

    // DITA <topic> can appear in the parsed object as data.topic.title, data.topic.body, etc.
    const topic = parsedXml.topic || parsedXml.concept || parsedXml.glossgroup || {};
    const title = topic.title;
    const body = topic.body || topic.conbody;

    // We'll do a naive render of body paragraphs
    const paragraphs = [];
    if (body?.p) {
        if (Array.isArray(body.p)) {
            paragraphs.push(...body.p);
        } else {
            paragraphs.push(body.p);
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.leftMenu}>
                <LeftMenu />
            </div>
            <div style={styles.content}>
                <h1>{title}</h1>
                {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                ))}
                {/* If you have <fig>, <table>, etc., handle them similarly. */}
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'grid',
        gridTemplateColumns: '250px 1fr',
    },
    leftMenu: {
        borderRight: '1px solid #ccc',
        padding: '1rem'
    },
    content: {
        padding: '1rem'
    }
};

export default ContentPage;
