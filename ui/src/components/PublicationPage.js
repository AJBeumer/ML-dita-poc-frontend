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

    // Helper function to fetch envelopes for a given language.
    async function fetchEnvsForLang(lang) {
        try {
            const res = await fetch(`http://localhost:3001/api/envelopes?lang=${lang}`);
            if (!res.ok) {
                console.error('Error fetching envelopes for language', lang);
                return [];
            }
            return await res.json();
        } catch (err) {
            console.error('Error in fetchEnvsForLang:', err);
            return [];
        }
    }

    // Envelope lookup effect. Fallback to English if needed.
// ...
    useEffect(() => {
        async function loadEnvUri() {
            const urlParams = new URLSearchParams(search);
            let uri = urlParams.get('envUri');
            const currentLang = i18n.language.toLowerCase();
            // Retrieve stored translationGroup using programme in lowercase.
            const storedGroupKey = `translationGroup_${programme.toLowerCase()}`;
            const storedGroup = localStorage.getItem(storedGroupKey);
            console.log('[PublicationPage] Current language:', currentLang);
            console.log('[PublicationPage] URL publicationName:', publicationName);
            console.log('[PublicationPage] Programme from URL:', programme);
            console.log('[PublicationPage] Stored translationGroup (' + storedGroupKey + '):', storedGroup);

            let allEnvs = await fetchEnvsForLang(currentLang);
            if(allEnvs.length === 0){
                console.warn(`[PublicationPage] No envelopes found for language ${currentLang}, falling back to English.`);
                allEnvs = await fetchEnvsForLang('en');
            }
            console.log('[PublicationPage] All envelopes fetched:', allEnvs);

            let candidates = [];
            if (storedGroup) {
                candidates = allEnvs.filter(
                    env =>
                        env.translationGroup.toLowerCase() === storedGroup.toLowerCase() &&
                        env.programme.toLowerCase() === programme.toLowerCase()
                );
                console.log('[PublicationPage] Candidates using stored translationGroup:', candidates);
            } else {
                candidates = allEnvs.filter(
                    env =>
                        env.publication.toLowerCase() === publicationName.toLowerCase() &&
                        env.programme.toLowerCase() === programme.toLowerCase()
                );
                console.log('[PublicationPage] Candidates by publication name:', candidates);
            }
            if (candidates.length === 0) {
                console.error(`No envelope found for publication: ${publicationName} and programme: ${programme} in language ${currentLang}`);
                return;
            }
            let candidate = candidates.find(env => env.language.toLowerCase() === currentLang);
            if (!candidate) {
                console.warn(`No envelope found in language ${currentLang}, falling back to English.`);
                candidate = candidates.find(env => env.language.toLowerCase() === 'en');
            }
            if (!candidate) {
                candidate = candidates[0];
            }
            uri = candidate.envelopeUri;
            console.log('[PublicationPage] Selected envelopeUri:', uri);
            setEnvUri(uri);
        }
        loadEnvUri();
    }, [search, publicationName, programme, i18n.language, navigate]);


    // Fetch the envelope using envUri.
    useEffect(() => {
        async function loadEnvelope() {
            if (!envUri) return;
            const url = `http://localhost:3001/api/envelope?uri=${encodeURIComponent(envUri)}`;
            try {
                const res = await fetch(url);
                if (!res.ok) {
                    console.error(`Envelope not found for URI: ${envUri}`);
                    return;
                }
                const data = await res.json();
                console.log('[PublicationPage] Loaded envelope data:', data.envelope);
                setEnvelopeData(data.envelope);
            } catch (err) {
                console.error('Error fetching envelope:', err);
            }
        }
        loadEnvelope();
    }, [envUri]);

    // Update URL if loaded envelope's publication differs from URL parameter.
    useEffect(() => {
        if (envelopeData && envelopeData.headers && envelopeData.headers.publication) {
            const actualPub = envelopeData.headers.publication;
            if (actualPub.toLowerCase() !== publicationName.toLowerCase()) {
                console.log('[PublicationPage] Updating URL publication name from', publicationName, 'to', actualPub);
                navigate(`/${programme.toLowerCase()}/${encodeURIComponent(actualPub)}`, { replace: true });
            }
        }
    }, [envelopeData, publicationName, programme, navigate]);

    // Auto-navigate to the first topic if needed.
    useEffect(() => {
        if (!envelopeData) return;
        const topics =
            envelopeData.instance &&
            envelopeData.instance.ditaMap &&
            envelopeData.instance.ditaMap.files;
        if (topics && topics.length > 0 && !pathname.includes('/topic/')) {
            navigate(`topic/${encodeURIComponent(topics[0].uri)}`);
        }
    }, [envelopeData, pathname, navigate]);

    if (!envUri) {
        return <div>{t('NoEnvelopeURI', { publication: publicationName })}</div>;
    }
    if (!envelopeData) {
        return <div>{t('LoadingEnvelope', { publication: publicationName })}</div>;
    }

    const pubLastModified = envelopeData.headers.lastModified;
    const topics =
        (envelopeData.instance &&
            envelopeData.instance.ditaMap &&
            envelopeData.instance.ditaMap.files) || [];

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
                <Outlet />
            </div>
        </div>
    );
}

export default PublicationPage;
