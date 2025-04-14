// src/components/PublicationsList.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function PublicationsList() {
    const [groupedSitemaps, setGroupedSitemaps] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        async function loadEnvelopes() {
            try {
                const res = await fetch('http://localhost:3001/api/envelopes');
                if (!res.ok) {
                    console.warn('Error fetching envelopes.');
                    return;
                }
                const data = await res.json();
                // Group by programme, then within programme group by subject.
                const grouped = data.reduce((acc, env) => {
                    const prog = env.programme.toUpperCase();
                    if (!acc[prog]) acc[prog] = {};
                    const subject = env.subject || 'General';
                    if (!acc[prog][subject]) acc[prog][subject] = [];
                    acc[prog][subject].push(env);
                    return acc;
                }, {});
                setGroupedSitemaps(grouped);
            } catch (err) {
                console.error('Error loading envelopes in PublicationsList:', err);
            }
        }
        loadEnvelopes();
    }, []);

    // Publication is highlighted if its lastModified timestamp is within the last 10 minutes OR
    // if there's no localStorage record or the stored value is older than the publication's lastModified.
    function isPublicationHighlighted(pub) {
        const now = new Date();
        const pubLastModified = new Date(pub.lastModified);
        const recencyHighlight = ((now - pubLastModified) / (1000 * 60)) <= 10;

        const pubKey = `pubLastSeen_${pub.publication}`;
        const storedTimestamp = localStorage.getItem(pubKey);
        const localStorageHighlight = !storedTimestamp || pubLastModified > new Date(storedTimestamp);

        console.log(
            `Publication "${pub.publication}" recencyHighlight: ${recencyHighlight}, localStorageHighlight: ${localStorageHighlight}`
        );
        return recencyHighlight || localStorageHighlight;
    }

    function handleClick(env) {
        const pubKey = `pubLastSeen_${env.publication}`;
        // When clicking a publication, store its current lastModified value
        localStorage.setItem(pubKey, env.lastModified);
        navigate(`/${env.programme}/${encodeURIComponent(env.publication)}?envUri=${encodeURIComponent(env.envelopeUri)}`);
    }

    return (
        <div>
            <h1>Publications</h1>
            {Object.keys(groupedSitemaps).length === 0 ? (
                <p>Loading envelopes...</p>
            ) : (
                Object.entries(groupedSitemaps).map(([prog, subjects]) => (
                    <div key={prog} style={styles.programmeBlock}>
                        <h2>{prog}</h2>
                        {Object.entries(subjects).map(([subject, pubs]) => (
                            <div key={subject} style={styles.subjectGroup}>
                                <h3>{subject}</h3>
                                <ul style={styles.publicationList}>
                                    {pubs.map((env, idx) => {
                                        const highlight = isPublicationHighlighted(env);
                                        const pubStyle = highlight ? styles.highlightLink : {};
                                        return (
                                            <li key={idx} style={styles.publicationItem} onClick={() => handleClick(env)}>
                                                <span style={{ ...pubStyle, cursor: 'pointer' }}>
                                                    {env.publication}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                ))
            )}
        </div>
    );
}

const styles = {
    programmeBlock: { border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' },
    subjectGroup: { marginBottom: '1rem' },
    publicationList: { listStyle: 'none', paddingLeft: '0' },
    publicationItem: { marginBottom: '0.5rem', textDecoration: 'underline' },
    highlightLink: { color: 'red', fontWeight: 'bold' }
};

export default PublicationsList;
