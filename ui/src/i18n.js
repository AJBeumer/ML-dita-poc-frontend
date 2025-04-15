// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en: {
        translation: {
            Home: "Home",
            WelcomeToDITAPublications: "Welcome to the DITA Publications",
            Publications: "Publications",
            LoadingOrNoData: "Loading or no data...",
            SitemapNotFound: "Sitemap for {{programme}} not found",
            ErrorFetchingSitemap: "Error fetching sitemap for {{programme}}: {{error}}",
            Menu: "Menu",
            NoEnvelopeURI: "No envelope URI provided for publication: {{publication}}",
            LoadingEnvelope: "Loading publication envelope for {{publication}}...",
            PublicationLabel: "Publication: {{publication}}",
            ProgrammeLabels: {
                pyp: "PYP",
                myp: "MYP",
                dp: "DP",
                cp: "CP"
            }
            // add any other generic keys here
        }
    },
    fr: {
        translation: {
            Home: "Accueil",
            WelcomeToDITAPublications: "Bienvenue aux publications DITA",
            Publications: "Publications",
            LoadingOrNoData: "Chargement ou aucune donnée...",
            SitemapNotFound: "Sitemap pour {{programme}} introuvable",
            ErrorFetchingSitemap: "Erreur lors du chargement de la sitemap pour {{programme}} : {{error}}",
            Menu: "Menu",
            NoEnvelopeURI: "Aucune URI d'enveloppe fournie pour la publication: {{publication}}",
            LoadingEnvelope: "Chargement de l'enveloppe de la publication {{publication}}...",
            PublicationLabel: "Publication: {{publication}}",
            ProgrammeLabels: {
                pyp: "PP",
                myp: "PEI",
                dp: "PDD",
                cp: "POP"
            }
        }
    },
    es: {
        translation: {
            Home: "Inicio",
            WelcomeToDITAPublications: "Bienvenido a las publicaciones DITA",
            Publications: "Publicaciones",
            LoadingOrNoData: "Cargando o sin datos...",
            SitemapNotFound: "Sitemap para {{programme}} no encontrado",
            ErrorFetchingSitemap: "Error al cargar el sitemap para {{programme}}: {{error}}",
            Menu: "Menú",
            NoEnvelopeURI: "No se proporcionó URI de sobre para la publicación: {{publication}}",
            LoadingEnvelope: "Cargando sobre de la publicación {{publication}}...",
            PublicationLabel: "Publicación: {{publication}}",
            ProgrammeLabels: {
                pyp: "PEP",
                myp: "PAI",
                dp: "PD",
                cp: "POP"
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: "en",
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
