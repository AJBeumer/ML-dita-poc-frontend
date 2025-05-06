// src/components/Header.js
import React from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import './Header.css';
// IBO logo asset (place an SVG at src/assets/ibo-logo.svg)
import {ReactComponent as IboLogo} from '../assets/ibo-logo.svg';

function Header() {
    const {t} = useTranslation();
    return (
        <header className="header">
            <div className="header-left">
                <Link to="/" className="logo-link">
                    <IboLogo className="logo-image" aria-label="ibo.org logo"/>
                    <span className="logo-text">ibo.org</span>
                </Link>
                <nav className="main-nav">
                    <ul className="nav-links">
                        <li><a href="/my-ib">{t('Nav.myIB')}</a></li>
                        <li><a href="/ibis">{t('Nav.ibis')}</a></li>
                        <li><a href="/students">{t('Nav.students')}</a></li>
                        <li><a href="/store">{t('Nav.store')}</a></li>
                        <li><a href="/blogs">{t('Nav.blogs')}</a></li>
                        <li><a href="/ask">{t('Nav.ask')}</a></li>
                    </ul>
                </nav>
            </div>
            <div className="header-right">
                <LanguageSelector/>
            </div>
        </header>
    );
}

export default Header;
