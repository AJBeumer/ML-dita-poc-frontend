// server.js (ESM format)

import express from 'express';
import cors from 'cors';
import { createDatabaseClient, queryBuilder } from 'marklogic';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const port = 3001;

// MarkLogic connection (point to your final DB or correct port)
const mlConn = {
    host: 'localhost',
    port: 8011,
    user: 'admin',
    password: 'admin',
    authType: 'digest',
    // If needed, specify:
    // database: 'data-hub-FINAL'
};

const db = createDatabaseClient(mlConn);
const qb = queryBuilder;

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
});

/* ------------------------------------------------------------------
   2) GET /api/envelope?uri=...
      Returns the envelope document as JSON
------------------------------------------------------------------ */
// GET /api/envelopes: Returns all envelope metadata from the "dita-envelope" collection
app.get('/api/envelopes', async (req, res) => {
    try {
        const docs = await db.documents.query(
            qb.where(qb.collection('dita-envelope'))
        ).result();

        const results = docs.map(doc => {
            const headers = doc.content.envelope?.headers || {};
            return {
                publication: headers.publication || 'UntitledPub',
                programme: headers.programme || 'DP',
                subject: headers.subject || '',
                envelopeUri: doc.uri,               // MarkLogic document URI for the envelope
                ditamapUri: headers.uri || '',       // Could be used as envelope URI if desired
                lastModified: headers.lastModified   // Publication-level lastModified
            };
        });
        res.json(results);
    } catch (err) {
        console.error('Error in GET /api/envelopes:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/envelope?uri=...: Returns a single envelope document (full content)
app.get('/api/envelope', async (req, res) => {
    const docUri = req.query.uri;
    if (!docUri) return res.status(400).json({ error: 'Missing ?uri=' });
    try {
        const docs = await db.documents.read(docUri).result();
        if (!docs || docs.length === 0) return res.status(404).json({ error: 'Envelope not found' });
        res.json(docs[0].content);
    } catch (err) {
        console.error('Error in GET /api/envelope:', err);
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------------------------------
   1) GET /api/publications
      Returns an array of publication metadata from the "dita-envelope" collection
------------------------------------------------------------------ */
app.get('/api/publications', async (req, res) => {
    try {
        const docs = await db.documents.query(qb.where(qb.collection('dita-envelope'))).result();
        const finalList = docs.map(doc => {
            const headers = doc.content.envelope?.headers || {};
            return {
                publication: headers.publication || doc.uri,
                programme: headers.programme || 'DP',
                lastModified: headers.lastModified || new Date().toISOString(),
                envelopeUri: `/api/envelope?uri=${encodeURIComponent(doc.uri)}`
            };
        });
        res.json(finalList);
    } catch (err) {
        console.error('Error in /api/publications:', err);
        res.status(500).json({ error: err.message });
    }
});



/* ------------------------------------------------------------------
   3) GET /api/ditamap?uri=...
      Fetches a DITA map (XML) from MarkLogic, converts to JSON
------------------------------------------------------------------ */
app.get('/api/ditamap', async (req, res) => {
    const docUri = req.query.uri;
    if (!docUri) {
        return res.status(400).json({ error: 'Missing ?uri=' });
    }
    try {
        const docs = await db.documents.read(docUri).result();
        if (!docs || docs.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        let content = docs[0].content;
        if (typeof content === 'string') {
            content = parser.parse(content);
        }
        res.json(content);
    } catch (err) {
        console.error('Error in /api/ditamap:', err);
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------------------------------
   4) GET /api/dita-xml?uri=...
      Fetches a DITA topic (XML) from MarkLogic, converts to JSON
------------------------------------------------------------------ */
app.get('/api/dita-xml', async (req, res) => {
    const docUri = req.query.uri;
    if (!docUri) {
        return res.status(400).json({ error: 'Missing ?uri=' });
    }
    try {
        const docs = await db.documents.read(docUri).result();
        if (!docs || docs.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        let content = docs[0].content;
        if (typeof content === 'string') {
            content = parser.parse(content);
        }
        res.json(content);
    } catch (err) {
        console.error('Error in /api/dita-xml:', err);
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------------------------------
   5) GET /api/dita-image?uri=...
      Streams a binary image from MarkLogic
------------------------------------------------------------------ */
app.get('/api/dita-image', async (req, res) => {
    const docUri = req.query.uri;
    if (!docUri) return res.status(400).json({ error: 'Missing ?uri=' });
    try {
        const docs = await db.documents.read(docUri, { categories: ['content'] }).result();
        if (!docs || docs.length === 0) return res.status(404).json({ error: 'Not found' });
        const doc = docs[0];
        if (doc.format === 'binary') {
            res.setHeader('Content-Type', doc.contentType || 'application/octet-stream');
            res.send(doc.content);
        } else {
            res.send(doc.content);
        }
    } catch (err) {
        console.error('Error in /api/dita-image:', err);
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------------------------------
   6) generateSitemaps() function
      Creates or overwrites dp.json, cp.json, myp.json, pyp.json
      by scanning the "dita-envelope" collection
------------------------------------------------------------------ */
async function generateSitemaps() {
    const docs = await db.documents.query(
        qb.where(qb.collection('dita-envelope'))
    ).result();

    const sitemaps = { DP: {}, CP: {}, MYP: {}, PYP: {} };

    for (const doc of docs) {
        const headers = doc.content.envelope?.headers || {};
        const instance = doc.content.envelope?.instance || {};
        const programme = headers.programme || 'DP';
        const subject = headers.subject || 'general';

        if (!sitemaps[programme][subject]) {
            sitemaps[programme][subject] = [];
        }
        sitemaps[programme][subject].push({
            publication: headers.publication || doc.uri,
            language: headers.language || 'en',
            status: headers.status || 'go-live',
            lastModified: headers.lastModified || new Date().toISOString(),
            ditamapUri: headers.uri || '',
            topics: instance.ditaMap?.files || [],
            attachments: instance.ditaMap?.attachments || []
        });
    }

    for (const [programme, subjectData] of Object.entries(sitemaps)) {
        const sitemapContent = {
            programme,
            subjects: Object.entries(subjectData).map(([subject, publications]) => ({
                subject,
                publications
            }))
        };
        const sitemapFilename = `${programme.toLowerCase()}.json`;
        const sitemapPath = path.join('sitemaps', sitemapFilename);
        fs.writeFileSync(sitemapPath, JSON.stringify(sitemapContent, null, 2));
    }
}

/* ------------------------------------------------------------------
   7) GET /api/generate-sitemaps
      Manually triggers generation
------------------------------------------------------------------ */
app.get('/api/generate-sitemaps', async (req, res) => {
    try {
        await generateSitemaps();
        res.status(200).json({ message: 'Sitemaps generated successfully.' });
    } catch (err) {
        console.error('Error generating sitemaps:', err);
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------------------------------
   8) MarkLogic Trigger -> POST /api/incremental-sitemap-update
      Instead of incremental logic, we just call generateSitemaps().
------------------------------------------------------------------ */
app.post('/api/incremental-sitemap-update', async (req, res) => {
    try {
        console.log('[TRIGGER] Received request from MarkLogic to regenerate sitemaps:', req.body);
        // Instead of incremental updates, just do a full regeneration:
        await generateSitemaps();
        return res.status(200).json({ message: 'Sitemaps regenerated automatically.' });
    } catch (err) {
        console.error('Error in /api/incremental-sitemap-update:', err);
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------------------------------
   9) GET /api/sitemap/:programme
      e.g. GET /api/sitemap/dp
------------------------------------------------------------------ */
app.get('/api/sitemap/:programme', (req, res) => {
    const prog = req.params.programme.toLowerCase();
    const sitemapPath = path.join('sitemaps', `${prog}.json`);
    if (fs.existsSync(sitemapPath)) {
        res.sendFile(path.resolve(sitemapPath));
    } else {
        res.status(404).json({ error: 'Sitemap not found' });
    }
});

/* ------------------------------------------------------------------
   Finally, start the Node server
------------------------------------------------------------------ */
app.listen(port, () => {
    console.log(`MarkLogic middle-tier running on http://localhost:${port}`);
});
