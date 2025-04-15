// src/components/PublicationsList.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function PublicationsList() {
    const [sitemapData, setSitemapData] = useState({});
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language.toLowerCase();
    const navigate = useNavigate();

    // List of expected programme keys (lowercase).
    const programmeKeys = ["dp", "cp", "myp", "pyp"];

    useEffect(() => {
        async function loadAllSitemaps() {
            const fetchedSitemaps = {};
            const fetchPromises = programmeKeys.map(async (prog) => {
                try {
                    const res = await fetch(`http://localhost:3001/api/sitemap/${prog}`);
                    if (!res.ok) {
                        console.warn(t('SitemapNotFound', { programme: prog.toUpperCase() }));
                        return;
                    }
                    const data = await res.json();
                    // Store with key in lowercase.
                    fetchedSitemaps[data.programme.toLowerCase()] = data;
                } catch (err) {
                    console.error(t('ErrorFetchingSitemap', { programme: prog.toUpperCase(), error: err.message }));
                }
            });
            await Promise.all(fetchPromises);
            setSitemapData(fetchedSitemaps);
        }
        loadAllSitemaps();
    }, [t, i18n.language]);

    function renderProgramme(progData) {
        return (
            <div key={progData.programme} style={styles.programmeBlock}>
                <h2>{progData.programme}</h2>
                {progData.subjects.map((subjectObj, subjIdx) => (
                    <div key={subjIdx} style={styles.subjectGroup}>
                        <h3>{subjectObj.subject}</h3>
                        <ul style={styles.publicationList}>
                            {subjectObj.groups.map((group, groupIdx) => {
                                // "Parent" envelope is always the first item (English)
                                const parentEnv = group.publications[0];
                                // For display, choose envelope matching current language (if any), fallback to parent's.
                                const displayEnv = group.publications.find(pub => pub.language.toLowerCase() === currentLang) ||
                                    parentEnv;
                                return (
                                    <li key={groupIdx} style={styles.publicationItem} onClick={() => handleClick(parentEnv, displayEnv)}>
                                        {displayEnv.publication}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>
        );
    }

    // When a publication is clicked, store the parent envelope's translationGroup
    // and navigate using the display envelope's publication (for URL) and parent's envelopeUri (for content).
    function handleClick(parentEnv, displayEnv) {
        console.log('[PublicationsList] Clicked envelope (parent):', parentEnv);
        // Save read time under key based on parent's translationGroup.
        localStorage.setItem(`pubLastSeen_${parentEnv.translationGroup}`, parentEnv.lastModified);
        // Always store the parent's translationGroup using programme in lowercase.
        localStorage.setItem(`translationGroup_${parentEnv.programme.toLowerCase()}`, parentEnv.translationGroup);
        navigate(`/${parentEnv.programme.toLowerCase()}/${encodeURIComponent(displayEnv.publication)}?envUri=${encodeURIComponent(parentEnv.envelopeUri)}`);
    }

    if (Object.keys(sitemapData).length === 0) {
        return <p>{t('LoadingEnvelopes')}</p>;
    }

    return (
        <div>
            <h1>{t('Publications')}</h1>
            {Object.values(sitemapData).map(progData => renderProgramme(progData))}
        </div>
    );
}

const styles = {
    programmeBlock: { border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' },
    subjectGroup: { marginBottom: '1rem' },
    publicationList: { listStyle: 'none', paddingLeft: '0' },
    publicationItem: { cursor: 'pointer', marginBottom: '0.5rem', textDecoration: 'underline' }
};

export default PublicationsList;
