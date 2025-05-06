// src/components/LeftMenu.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './LeftMenu.module.css';

function LeftMenu({ publicationName, programme, pubLastModified, topics }) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const detectLang = uri => {
        const l = uri.toLowerCase();
        return l.includes('_fr.xml') ? 'fr' : l.includes('_es.xml') ? 'es' : 'en';
    };

    const shouldHighlight = topic => {
        if (detectLang(topic.uri) !== i18n.language.toLowerCase()) return false;
        const mod = new Date(topic.lastModified).getTime();
        if (Date.now() - mod < 2 * 60 * 1000) return true;
        const seen = localStorage.getItem(`topicLastSeen_${topic.uri}`);
        return !seen || mod > new Date(seen).getTime();
    };

    const handleClick = topic => {
        localStorage.setItem(`topicLastSeen_${topic.uri}`, topic.lastModified);
        navigate(`/${programme}/${encodeURIComponent(publicationName)}/topic/${encodeURIComponent(topic.uri)}`);
    };

    const renderItems = (list, depth = 0) => {
        if (!list || depth > 1) return null;
        return (
            <ul className={styles[`depth${depth}`]}>  {/* module-scoped */}
                {list.map(topic => (
                    <li key={topic.uri} className={depth === 0 ? styles.parent : styles.child}>
                        <button
                            className={[styles.button, shouldHighlight(topic) ? styles.highlight : ''].join(' ')}
                            onClick={() => handleClick(topic)}
                        >
                            {topic.title}
                        </button>
                        {depth < 1 && renderItems(topic.children, depth + 1)}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <nav className={styles.container}>
            <h3 className={styles.title}>{t('Menu')}</h3>
            {topics?.length ? renderItems(topics) : <p className={styles.empty}>{t('NoTopicsFound')}</p>}
        </nav>
    );
}

export default LeftMenu;