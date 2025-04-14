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
                    if (!acc[prog]) {
                        acc[prog] = {};
                    }
                    const subject = env.subject || 'General';
                    if (!acc[prog][subject]) {
                        acc[prog][subject] = [];
                    }
                    acc[prog][subject].push(env);
                    return acc;
                }, {});
                console.log('Grouped sitemaps:', grouped);
                setGroupedSitemaps(grouped);
            } catch (err) {
                console.error('Error loading envelopes in PublicationsList:', err);
            }
        }
        loadEnvelopes();
    }, []);

    function handleClick(env) {
        // Mark publication as seen
        localStorage.setItem(`pubLastSeen_${env.publication}`, env.lastModified);
        // Navigate to PublicationPage, sending the envelope URI in query param.
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
                                    {pubs.map((env, idx) => (
                                        <li key={idx} style={styles.publicationItem} onClick={() => handleClick(env)}>
                                            {env.publication}
                                        </li>
                                    ))}
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
    programmeBlock: {
        border: '1px solid #ccc',
        padding: '1rem',
        marginBottom: '1rem'
    },
    subjectGroup: {
        marginBottom: '1rem'
    },
    publicationList: {
        listStyle: 'none',
        paddingLeft: '0'
    },
    publicationItem: {
        cursor: 'pointer',
        marginBottom: '0.5rem',
        textDecoration: 'underline'
    }
};

export default PublicationsList;
