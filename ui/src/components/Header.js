// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import './Header.css';

function Header() {
    const { t } = useTranslation();
    return (
        <header className="header">
            <div className="header-left">
                <Link to="/" className="home-link">{t('Home')}</Link>
            </div>
            <div className="header-right">
                <LanguageSelector />
            </div>
        </header>
    );
}

export default Header;
