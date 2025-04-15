// src/components/HomePage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

function HomePage() {
    const { t } = useTranslation();
    const [dpData, setDpData] = useState(null);
    const [cpData, setCpData] = useState(null);
    const [mypData, setMypData] = useState(null);
    const [pypData, setPypData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        async function loadProgramme(programme, setFn) {
            try {
                const res = await fetch(`http://localhost:3001/api/sitemap/${programme}`);
                if (!res.ok) {
                    console.warn(t('SitemapNotFound', { programme }));
                    return;
                }
                const data = await res.json();
                setFn(data);
            } catch (err) {
                console.error(t('ErrorFetchingSitemap', { programme, error: err.message }));
            }
        }
        loadProgramme('dp', setDpData);
        loadProgramme('cp', setCpData);
        loadProgramme('myp', setMypData);
        loadProgramme('pyp', setPypData);
    }, [t]);

    // Publication is highlighted if its lastModified is newer than the stored value.
    function isPublicationHighlighted(pub) {
        const lastSeenKey = `pubLastSeen_${pub.publication}`;
        const storedTimestamp = localStorage.getItem(lastSeenKey);
        if (!storedTimestamp) return true;
        const pubLastModified = new Date(pub.lastModified);
        const lastSeen = new Date(storedTimestamp);
        return pubLastModified > lastSeen;
    }

    function handlePublicationClick(pub) {
        const lastSeenKey = `pubLastSeen_${pub.publication}`;
        localStorage.setItem(lastSeenKey, pub.lastModified);
        navigate(`/${encodeURIComponent(pub.programme)}/${encodeURIComponent(pub.publication)}`);
    }

    function renderProgrammeBlock(progName, data) {
        if (!data) {
            return (
                <div style={styles.column}>
                    <h2>{t(`ProgrammeLabels.${progName.toLowerCase()}`)}</h2>
                    <p>{t('LoadingOrNoData')}</p>
                </div>
            );
        }
        return (
            <div style={styles.column}>
                <h2>{progName.toUpperCase()}</h2>
                {data.subjects.map((subjBlock, idx) => (
                    <div key={idx} style={styles.subjectBlock}>
                        <h3>{subjBlock.subject}</h3>
                        {subjBlock.publications.map((pub, idx2) => {
                            const highlight = isPublicationHighlighted(pub);
                            const pubStyle = highlight ? styles.highlightLink : {};
                            return (
                                <div key={idx2}>
                                    <span
                                        onClick={() => handlePublicationClick(pub)}
                                        style={{ ...styles.pubLink, ...pubStyle }}
                                    >
                                        {pub.publication}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>{t('WelcomeToDITAPublications')}</h1>
                <LanguageSelector />
            </header>
            <div style={styles.fourColumn}>
                {renderProgrammeBlock('dp', dpData)}
                {renderProgrammeBlock('cp', cpData)}
                {renderProgrammeBlock('myp', mypData)}
                {renderProgrammeBlock('pyp', pypData)}
            </div>
        </div>
    );
}

const styles = {
    container: { padding: '1rem', maxWidth: '960px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    fourColumn: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' },
    column: { border: '1px solid #ccc', padding: '1rem', minHeight: '200px' },
    subjectBlock: { marginBottom: '1rem' },
    pubLink: { cursor: 'pointer', textDecoration: 'underline' },
    highlightLink: { color: 'red', fontWeight: 'bold' }
};

export default HomePage;
