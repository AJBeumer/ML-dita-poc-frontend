import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './LeftMenu.module.css';

function LeftMenu({ publicationName, programme, topics }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleClick = topic => {
        navigate(`/${programme}/${encodeURIComponent(publicationName)}/topic/${encodeURIComponent(topic.uri)}`);
    };

    const renderItems = (list, depth = 0) => {
        if (!list || depth > 1) return null;
        return (
            <ul className={styles[`depth${depth}`]}>
                {list.map(topic => (
                    <li key={topic.uri} className={depth === 0 ? styles.parent : styles.child}>
                        <button
                            className={styles.button}
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
