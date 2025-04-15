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
    authType: 'digest'
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
   1) GET /api/envelopes
       Returns all envelope metadata from the "dita-envelope" collection.
       If a query parameter 'lang' is provided, only envelopes matching that language are returned.
------------------------------------------------------------------ */
app.get('/api/envelopes', async (req, res) => {
    try {
        const docs = await db.documents.query(qb.where(qb.collection('dita-envelope'))).result();

        const results = docs.map(doc => {
            const headers = doc.content.envelope?.headers || {};
            // Compute a translationGroup:
            // If "translationOf" exists and is non-empty, use that.
            // Otherwise, derive from the ditamapUri (e.g. the file name).
            let translationGroup = "";
            if (headers.translationOf && headers.translationOf.trim() !== "") {
                translationGroup = headers.translationOf.trim().toLowerCase();
            } else if (headers.uri) {
                translationGroup = headers.uri.split('/').pop().toLowerCase();
            } else {
                translationGroup = (headers.publication || 'untitled').toLowerCase();
            }
            return {
                publication: headers.publication || 'UntitledPub',
                programme: headers.programme || 'DP',  // default to 'DP' if not present
                subject: headers.subject || '',
                envelopeUri: doc.uri,               // MarkLogic document URI for the envelope
                ditamapUri: headers.uri || '',       // Could be used as envelope URI if desired
                lastModified: headers.lastModified,   // Publication-level lastModified
                language: headers.language || 'en',   // Language (default to English)
                translationOf: headers.translationOf || '',
                translationGroup // new field tying related envelopes together
            };
        });
        if (req.query.lang) {
            const lang = req.query.lang.toLowerCase();
            res.json(results.filter(env => env.language.toLowerCase() === lang));
        } else {
            res.json(results);
        }
    } catch (err) {
        console.error('Error in GET /api/envelopes:', err);
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------------------------------
   2) GET /api/envelope?uri=...
       Returns a single envelope document (full content) by URI.
------------------------------------------------------------------ */
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
   3) GET /api/publications
       Returns an array of publication metadata from the "dita-envelope" collection.
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
        console.error('Error in GET /api/publications:', err);
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------------------------------
   4) GET /api/ditamap?uri=...
       Fetches a DITA map (XML) from MarkLogic and converts it to JSON.
------------------------------------------------------------------ */
app.get('/api/ditamap', async (req, res) => {
    const docUri = req.query.uri;
    if (!docUri) return res.status(400).json({ error: 'Missing ?uri=' });
    try {
        const docs = await db.documents.read(docUri).result();
        if (!docs || docs.length === 0) return res.status(404).json({ error: 'Not found' });
        let content = docs[0].content;
        if (typeof content === 'string') {
            content = parser.parse(content);
        }
        res.json(content);
    } catch (err) {
        console.error('Error in GET /api/ditamap:', err);
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------------------------------
   5) GET /api/dita-xml?uri=...
       Fetches a DITA topic (XML) from MarkLogic and converts it to JSON.
------------------------------------------------------------------ */
app.get('/api/dita-xml', async (req, res) => {
    const docUri = req.query.uri;
    if (!docUri) return res.status(400).json({ error: 'Missing ?uri=' });
    try {
        const docs = await db.documents.read(docUri).result();
        if (!docs || docs.length === 0) return res.status(404).json({ error: 'Not found' });
        let content = docs[0].content;
        if (typeof content === 'string') {
            content = parser.parse(content);
        }
        res.json(content);
    } catch (err) {
        console.error('Error in GET /api/dita-xml:', err);
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------------------------------
   6) GET /api/dita-image?uri=...
       Streams a binary image from MarkLogic.
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
        console.error('Error in GET /api/dita-image:', err);
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------------------------------
   7) GET /api/generate-sitemaps
       Manually triggers generation of sitemaps by scanning the "dita-envelope" collection.
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
   8) POST /api/incremental-sitemap-update
       Triggered by MarkLogic: instead of incremental logic, performs a full regeneration of sitemaps.
------------------------------------------------------------------ */
app.post('/api/incremental-sitemap-update', async (req, res) => {
    try {
        console.log('[TRIGGER] Received request from MarkLogic to regenerate sitemaps:', req.body);
        await generateSitemaps();
        res.status(200).json({ message: 'Sitemaps regenerated automatically.' });
    } catch (err) {
        console.error('Error in POST /api/incremental-sitemap-update:', err);
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------------------------------
   9) GET /api/sitemap/:programme
       Serves the sitemap file for a given programme (e.g., GET /api/sitemap/dp).
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
   generateSitemaps()
       Scans the "dita-envelope" collection and creates/overwrites one sitemap JSON file per programme.
       The sitemap structure is grouped as follows:
         {
           programme: "PYP",
           subjects: [
             {
               subject: "wiskunde",
               groups: [
                 {
                   translationGroup: "clogs.ditamap",
                   publications: [ { envelope object }, { envelope object } ]
                 },
                 // ... other groups
               ]
             },
             // ... other subjects
           ]
         }
------------------------------------------------------------------ */
async function generateSitemaps() {
    const docs = await db.documents.query(qb.where(qb.collection('dita-envelope'))).result();

    // Build nested structure: programme -> subject -> rawTranslationGroup -> [envelope objects]
    const sitemaps = {};
    for (const doc of docs) {
        const headers = doc.content.envelope?.headers || {};
        const instance = doc.content.envelope?.instance || {};
        // Use headers.programme or default.
        const programmeKey =
            headers.programme && headers.programme.trim() !== ""
                ? headers.programme.trim()
                : 'PYP';
        const subject = headers.subject || 'general';

        // Compute rawTranslationGroup:
        let rawTranslationGroup = "";
        if (headers.translationOf && headers.translationOf.trim() !== "") {
            rawTranslationGroup = headers.translationOf.trim().toLowerCase();
        } else if (headers.uri) {
            rawTranslationGroup = headers.uri.split('/').pop().toLowerCase();
        } else {
            rawTranslationGroup = (headers.publication || 'untitled').toLowerCase();
        }

        if (!sitemaps[programmeKey]) {
            sitemaps[programmeKey] = {};
        }
        if (!sitemaps[programmeKey][subject]) {
            sitemaps[programmeKey][subject] = {};
        }
        if (!sitemaps[programmeKey][subject][rawTranslationGroup]) {
            sitemaps[programmeKey][subject][rawTranslationGroup] = [];
        }
        sitemaps[programmeKey][subject][rawTranslationGroup].push({
            publication: headers.publication || doc.uri,
            language: headers.language || 'en',
            status: headers.status || 'go-live',
            lastModified: headers.lastModified || new Date().toISOString(),
            ditamapUri: headers.uri || '',
            envelopeUri: doc.uri, // Use the document's URI as envelopeUri.
            topics: instance.ditaMap?.files || [],
            attachments: instance.ditaMap?.attachments || [],
            programme: programmeKey,
            rawTranslationGroup // store raw computed value
        });
    }

    // Normalize translationGroup within each group:
    // For each group, if any envelope has a nonempty translationOf (i.e. rawTranslationGroup differs from the raw default based on publication),
    // then force all envelopes in the group to use that value.
    for (const programme in sitemaps) {
        for (const subject in sitemaps[programme]) {
            for (const group in sitemaps[programme][subject]) {
                const envelopes = sitemaps[programme][subject][group];
                let commonGroup = group; // default value: the raw group key
                // If any envelope has a rawTranslationGroup that doesn't equal the current group,
                // assume that envelope comes from a translation and use that value.
                for (const env of envelopes) {
                    if (env.rawTranslationGroup && env.rawTranslationGroup !== group) {
                        commonGroup = env.rawTranslationGroup;
                        break;
                    }
                }
                // Update each envelope with the commonGroup.
                envelopes.forEach(env => {
                    env.translationGroup = commonGroup;
                });
                // Optionally, if you want to update the grouping key, you could do that here.
            }
        }
    }

    // For each group, sort envelope objects so that the EN envelope is first.
    for (const programme in sitemaps) {
        for (const subject in sitemaps[programme]) {
            for (const group in sitemaps[programme][subject]) {
                sitemaps[programme][subject][group].sort((a, b) => {
                    const aLang = a.language.toLowerCase();
                    const bLang = b.language.toLowerCase();
                    if (aLang === 'en' && bLang !== 'en') return -1;
                    if (aLang !== 'en' && bLang === 'en') return 1;
                    return 0;
                });
            }
        }
    }

    // Convert nested structure to final array format per programme.
    const finalSitemaps = {};
    for (const [programme, subjectData] of Object.entries(sitemaps)) {
        finalSitemaps[programme] = {
            programme,
            subjects: Object.entries(subjectData).map(([subject, groups]) => ({
                subject,
                groups: Object.entries(groups).map(([groupKey, publications]) => ({
                    // Use the common translationGroup from the first envelope.
                    translationGroup: publications[0]?.translationGroup || groupKey,
                    publications
                }))
            }))
        };
    }

    // Write each programme's sitemap to a JSON file in the "sitemaps" folder.
    for (const [programme, sitemapContent] of Object.entries(finalSitemaps)) {
        const sitemapFilename = `${programme.toLowerCase()}.json`;
        const sitemapPath = path.join('sitemaps', sitemapFilename);
        fs.writeFileSync(sitemapPath, JSON.stringify(sitemapContent, null, 2));
    }
}




app.listen(port, () => {
    console.log(`MarkLogic middle-tier running on http://localhost:${port}`);
});
