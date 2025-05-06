// src/components/PublicationPage.js
import React, { useEffect, useState } from 'react';
import { Outlet, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LeftMenu from './LeftMenu';
import '../App.css';

function PublicationPage() {
    const { t, i18n } = useTranslation();
    const { programme, publicationName } = useParams();
    const { search, pathname } = useLocation();
    const navigate = useNavigate();

    const [envUri, setEnvUri] = useState(null);
    const [envelopeData, setEnvelopeData] = useState(null);

    async function fetchEnvsForLang(lang) {
        try {
            const res = await fetch(`http://localhost:3001/api/envelopes?lang=${lang}`);
            if (!res.ok) return [];
            return res.json();
        } catch {
            return [];
        }
    }

    useEffect(() => {
        async function loadEnvUri() {
            const currentLang = i18n.language.toLowerCase();
            const storedGroup = localStorage.getItem(`translationGroup_${programme.toLowerCase()}`);
            let allEnvs = await fetchEnvsForLang(currentLang);
            if (!allEnvs.length) allEnvs = await fetchEnvsForLang('en');

            const candidates = storedGroup
                ? allEnvs.filter(env => env.translationGroup.toLowerCase() === storedGroup && env.programme.toLowerCase() === programme.toLowerCase())
                : allEnvs.filter(env => env.publication.toLowerCase() === publicationName.toLowerCase() && env.programme.toLowerCase() === programme.toLowerCase());
            if (!candidates.length) return;

            const candidate = candidates.find(env => env.language.toLowerCase() === currentLang)
                || candidates.find(env => env.language.toLowerCase() === 'en')
                || candidates[0];
            setEnvUri(candidate.envelopeUri);
        }
        loadEnvUri();
    }, [search, publicationName, programme, i18n.language]);

    useEffect(() => {
        async function loadEnvelope() {
            if (!envUri) return;
            const res = await fetch(`http://localhost:3001/api/envelope?uri=${encodeURIComponent(envUri)}`);
            if (!res.ok) return;
            const data = await res.json();
            setEnvelopeData(data.envelope);
        }
        loadEnvelope();
    }, [envUri]);

    useEffect(() => {
        if (!envelopeData?.headers?.publication) return;
        const actual = envelopeData.headers.publication;
        if (actual.toLowerCase() !== publicationName.toLowerCase()) {
            navigate(`/${programme}/${encodeURIComponent(actual)}`, { replace: true });
        }
    }, [envelopeData, publicationName, programme, navigate]);

    useEffect(() => {
        const topics = envelopeData?.instance?.ditaMap?.files || [];
        if (topics.length && !pathname.includes('/topic/')) {
            navigate(`topic/${encodeURIComponent(topics[0].uri)}`);
        }
    }, [envelopeData, pathname, navigate]);

    if (!envUri) return <div>{t('NoEnvelopeURI', { publication: publicationName })}</div>;
    if (!envelopeData) return <div>{t('LoadingEnvelope', { publication: publicationName })}</div>;

    const pubLastModified = envelopeData.headers.lastModified;
    const topics = envelopeData.instance.ditaMap.files;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr' }}>
            <div style={{ borderRight: '1px solid #ccc', padding: '1rem' }}>
                <LeftMenu
                    publicationName={publicationName}
                    programme={programme}
                    pubLastModified={pubLastModified}
                    topics={topics}
                />
            </div>
            <div style={{ padding: '1rem' }}>
                <h2>{t('PublicationLabel', { publication: publicationName })}</h2>
                <Outlet context={{ topics }} />
            </div>
        </div>
    );
}

export default PublicationPage;