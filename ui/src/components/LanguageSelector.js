// src/components/LanguageSelector.js
import React from 'react';
import i18n from '../i18n';  // Import the initialized i18n instance

const LanguageSelector = () => {
    const handleLanguageChange = (e) => {
        i18n.changeLanguage(e.target.value);
    };

    return (
        <select
            onChange={handleLanguageChange}
            value={i18n.language}
            style={{ cursor: 'pointer', padding: '0.25rem', fontSize: '1rem' }}
        >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
        </select>
    );
};

export default LanguageSelector;
