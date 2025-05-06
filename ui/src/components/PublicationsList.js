// src/components/PublicationsList.js

import React, {useEffect, useState, useMemo} from 'react';
import {useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import './PublicationsList.css';

function PublicationsList() {
    const [sitemapData, setSitemapData] = useState({});
    const {t, i18n} = useTranslation();
    const currentLang = i18n.language.toLowerCase();
    const navigate = useNavigate();

    // Programme keys in desired order
    const programmeKeys = useMemo(() => ['dp', 'cp', 'myp', 'pyp'], []);

    // Fetch all programme sitemaps
    useEffect(() => {
        async function loadAllSitemaps() {
            const fetched = {};
            await Promise.all(
                programmeKeys.map(async (prog) => {
                    try {
                        const res = await fetch(`http://localhost:3001/api/sitemap/${prog}`);
                        if (!res.ok) {
                            console.warn(t('SitemapNotFound', {programme: prog.toUpperCase()}));
                            return;
                        }
                        const data = await res.json();
                        fetched[data.programme.toLowerCase()] = data;
                    } catch (err) {
                        console.error(
                            t('ErrorFetchingSitemap', {programme: prog.toUpperCase(), error: err.message})
                        );
                    }
                })
            );
            setSitemapData(fetched);
        }

        loadAllSitemaps();
    }, [t, i18n.language, programmeKeys]);

    // Sort programmes PYP, MYP, DP, CP
    const desiredOrder = ['pyp', 'myp', 'dp', 'cp'];
    const sortedSitemapData = useMemo(() => {
        return Object.values(sitemapData).sort(
            (a, b) => desiredOrder.indexOf(a.programme.toLowerCase())
                - desiredOrder.indexOf(b.programme.toLowerCase())
        );
    }, [sitemapData]);

    // Navigate on click, preserving translationGroup
    function handleClick(parentEnv, displayEnv) {
        const groupKey = parentEnv.translationGroup || parentEnv.publication;
        localStorage.setItem(`pubLastSeen_${groupKey}`, parentEnv.lastModified);
        localStorage.setItem(
            `translationGroup_${parentEnv.programme.toLowerCase()}`,
            parentEnv.translationGroup
        );
        navigate(
            `/${parentEnv.programme.toLowerCase()}/${encodeURIComponent(
                displayEnv.publication
            )}?envUri=${encodeURIComponent(parentEnv.envelopeUri)}`
        );
    }

    // Render programme card with header image + resource list
    function renderProgramme(progData) {
        const suffix =
            currentLang === 'fr' ? 'Fr' :
                currentLang === 'es' ? 'Sp' :
                    'En';
        const imgSrc =
            `${process.env.PUBLIC_URL}/images/programmes/` +
            `${progData.programme}_Colour_${suffix}.svg`;

        return (
            <div key={progData.programme} className="programme-block">
                {/* Hero header image */}
                <img
                    src={imgSrc}
                    alt={t(`ProgrammeLabels.${progData.programme.toLowerCase()}`)}
                    className="programme-image"
                />

                {progData.subjects.map((subjectObj, subjIdx) => (
                    <div key={subjIdx} className="subject-group">
                        <h3>{subjectObj.subject}</h3>
                        <ul className="publication-list">
                            {subjectObj.groups.map((group, groupIdx) => {
                                const parentEnv = group.publications[0];
                                const displayEnv =
                                    group.publications.find(
                                        pub => pub.language.toLowerCase() === currentLang
                                    ) || parentEnv;
                                return (
                                    <li
                                        key={groupIdx}
                                        className="publication-item"
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

    if (Object.keys(sitemapData).length === 0) {
        return <p>{t('LoadingEnvelopes')}</p>;
    }

    return (
        <>
            {/* Background video hero */}
            <div className="hero">
                <div className="video-background">
                    <iframe
                        src="https://player.vimeo.com/video/535740597?background=1&controls=0&loop=1&autoplay=1&autopause=0&muted=1&playsinline=1&transparent=1"
                        frameBorder="0"
                        allow="autoplay; fullscreen"
                        allowFullScreen
                    />
                </div>
                <div className="hero-overlay"/>
                <div className="hero-content">
                    <h1 className="hero-title">PRC POC</h1>
                    <div className="hero-search">
                        <input type="text" placeholder="Search…"/>
                    </div>
                </div>
            </div>

            {/* Publications grid */}
            <div className="programmes-container">
                {sortedSitemapData.map(renderProgramme)}
            </div>
        </>
    );
}

export default PublicationsList;
