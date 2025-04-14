// src/components/PublicationPage.js
import React, { useEffect, useState } from 'react';
import { Outlet, useParams, useLocation, useNavigate } from 'react-router-dom';
import LeftMenu from './LeftMenu';
import '../App.css';

function PublicationPage() {
    const { programme, publicationName } = useParams();
    const { search, pathname } = useLocation();
    const navigate = useNavigate();
    const [envUri, setEnvUri] = useState(null);
    const [envelopeData, setEnvelopeData] = useState(null);

    // Retrieve envelope URI from query string or locate it if missing
    useEffect(() => {
        async function loadEnvUri() {
            let uri = new URLSearchParams(search).get('envUri');
            if (!uri) {
                try {
                    const res = await fetch('http://localhost:3001/api/envelopes');
                    if (!res.ok) {
                        console.error('Error fetching envelopes for matching.');
                        return;
                    }
                    const allEnvs = await res.json();
                    const found = allEnvs.find(
                        env => env.publication === publicationName && env.programme === programme
                    );
                    if (found) {
                        uri = found.envelopeUri;
                    } else {
                        console.error(`No envelope found for publication: ${publicationName} and programme: ${programme}`);
                        return;
                    }
                } catch (err) {
                    console.error('Error fetching envelopes:', err);
                    return;
                }
            }
            setEnvUri(uri);
        }
        loadEnvUri();
    }, [search, publicationName, programme]);

    // Fetch the envelope using envUri
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
                setEnvelopeData(data.envelope);
            } catch (err) {
                console.error('Error fetching envelope:', err);
            }
        }
        loadEnvelope();
    }, [envUri]);

    // Automatically navigate to the first topic if not already in a topic route
    useEffect(() => {
        if (!envelopeData) return;
        const topics =
            envelopeData.instance &&
            envelopeData.instance.ditaMap &&
            envelopeData.instance.ditaMap.files;
        if (topics && topics.length > 0 && !pathname.includes('/topic/')) {
            // Navigate to the first topic (relative route)
            navigate(`topic/${encodeURIComponent(topics[0].uri)}`);
        }
    }, [envelopeData, pathname, navigate]);

    if (!envUri) {
        return <div>No envelope URI provided for publication: {publicationName}</div>;
    }

    if (!envelopeData) {
        return <div>Loading publication envelope for {publicationName}...</div>;
    }

    const pubLastModified = envelopeData.headers.lastModified;
    const topics =
        (envelopeData.instance &&
            envelopeData.instance.ditaMap &&
            envelopeData.instance.ditaMap.files) ||
        [];

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
                <h2>Publication: {publicationName}</h2>
                <Outlet />
            </div>
        </div>
    );
}

export default PublicationPage;
