import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import './HomePage.css';

function HomePage() {
    const { t, i18n } = useTranslation();
    const [dpData, setDpData] = useState(null);
    const [cpData, setCpData] = useState(null);
    const [mypData, setMypData] = useState(null);
    const [pypData, setPypData] = useState(null);
    const navigate = useNavigate();

    // Fetch sitemap data for each programme
    useEffect(() => {
        async function loadProgramme(programme, setFn) {
            try {
                const res = await fetch(
                    `http://localhost:3001/api/sitemap/${programme}?t=${Date.now()}`,
                    { cache: 'no-store' }
                );
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

    // Navigate to publication page
    function handlePublicationClick(pub) {
        navigate(`/${encodeURIComponent(pub.programme)}/${encodeURIComponent(pub.publication)}`);
    }

    // Render each programme block with an image header
    function renderProgrammeBlock(progName, data) {
        const lang = i18n.language.toLowerCase();
        const suffix = lang === 'fr' ? 'Fr' : lang === 'es' ? 'Sp' : 'En';
        const imgSrc =
            `${process.env.PUBLIC_URL}/images/programmes/` +
            `${progName.toUpperCase()}_Colour_${suffix}.svg`;

        if (!data) {
            return (
                <div className="column" key={progName}>
                    <img
                        src={imgSrc}
                        alt={t(`ProgrammeLabels.${progName.toLowerCase()}`)}
                        className="programme-image"
                    />
                    <p>{t('LoadingOrNoData')}</p>
                </div>
            );
        }

        return (
            <div className="column" key={progName}>
                <img
                    src={imgSrc}
                    alt={t(`ProgrammeLabels.${progName.toLowerCase()}`)}
                    className="programme-image"
                />
                {data.subjects.map((subjBlock, idx) => (
                    <div className="subject-block" key={idx}>
                        <h3>{subjBlock.subject}</h3>
                        {subjBlock.publications.map((pub, idx2) => (
                            <div key={idx2}>
                                <span
                                    className="pub-link"
                                    onClick={() => handlePublicationClick(pub)}
                                >
                                    {pub.publication}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="homepage-container">
            <header className="homepage-header">
                <h1>{t('WelcomeToDITAPublications')}</h1>
                <LanguageSelector />
            </header>
            <div className="two-column">
                {renderProgrammeBlock('dp', dpData)}
                {renderProgrammeBlock('cp', cpData)}
                {renderProgrammeBlock('myp', mypData)}
                {renderProgrammeBlock('pyp', pypData)}
            </div>
        </div>
    );
}

export default HomePage;
