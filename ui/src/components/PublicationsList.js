// src/components/PublicationsList.js
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function PublicationsList() {
    const [sitemapData, setSitemapData] = useState({});
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language.toLowerCase();
    const navigate = useNavigate();

    // Wrap programmeKeys in useMemo so that it doesn't change on every render.
    const programmeKeys = useMemo(() => ["dp", "cp", "myp", "pyp"], []);

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
                    // Store the sitemap under its programme key in lowercase.
                    fetchedSitemaps[data.programme.toLowerCase()] = data;
                } catch (err) {
                    console.error(t('ErrorFetchingSitemap', { programme: prog.toUpperCase(), error: err.message }));
                }
            });
            await Promise.all(fetchPromises);
            setSitemapData(fetchedSitemaps);
        }
        loadAllSitemaps();
    }, [t, i18n.language, programmeKeys]);

    // Desired programme order (using lowercase keys)
    const desiredOrder = ["pyp", "myp", "dp", "cp"];

    // Get an array of programmes sorted according to the desired order.
    const sortedSitemapData = useMemo(() => {
        const programmes = Object.values(sitemapData);
        return programmes.sort((a, b) => {
            const indexA = desiredOrder.indexOf(a.programme.toLowerCase());
            const indexB = desiredOrder.indexOf(b.programme.toLowerCase());
            return indexA - indexB;
        });
    }, [sitemapData, desiredOrder]);

    function renderProgramme(progData) {
        return (
            <div key={progData.programme} style={styles.programmeBlock}>
                <h2>{progData.programme}</h2>
                {progData.subjects.map((subjectObj, subjIdx) => (
                    <div key={subjIdx} style={styles.subjectGroup}>
                        <h3>{subjectObj.subject}</h3>
                        <ul style={styles.publicationList}>
                            {subjectObj.groups.map((group, groupIdx) => {
                                // Parent envelope is always the first envelope in each group.
                                const parentEnv = group.publications[0];
                                // For display (i.e. title in URL), choose envelope matching current language (if available); fallback to parent.
                                const displayEnv = group.publications.find(pub => pub.language.toLowerCase() === currentLang) || parentEnv;
                                return (
                                    <li
                                        key={groupIdx}
                                        style={styles.publicationItem}
                                        onClick={() => handleClick(parentEnv, displayEnv)}
                                    >
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

    function handleClick(parentEnv, displayEnv) {
        console.log('[PublicationsList] Clicked envelope (parent):', parentEnv);
        // Save publication read time using the parent's translationGroup as key (or fallback to publication name).
        const key = `pubLastSeen_${parentEnv.translationGroup || parentEnv.publication}`;
        localStorage.setItem(key, parentEnv.lastModified);
        // Store the parent's translationGroup under the key using programme in lowercase.
        localStorage.setItem(`translationGroup_${parentEnv.programme.toLowerCase()}`, parentEnv.translationGroup);
        console.log('[PublicationsList] Stored translationGroup for', parentEnv.programme.toLowerCase(), ':', localStorage.getItem(`translationGroup_${parentEnv.programme.toLowerCase()}`));
        navigate(`/${parentEnv.programme.toLowerCase()}/${encodeURIComponent(displayEnv.publication)}?envUri=${encodeURIComponent(parentEnv.envelopeUri)}`);
    }

    if (Object.keys(sitemapData).length === 0) {
        return <p>{t('LoadingEnvelopes')}</p>;
    }

    return (
        <div>
            <h1>{t('Publications')}</h1>
            {sortedSitemapData.map(progData => renderProgramme(progData))}
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
