import React, { useState, useRef, useEffect } from 'react';
import i18n from '../i18n';
import './LanguageSelector.css';

const LANGS = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'es', label: 'Español' }
];

export default function LanguageSelector() {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const currentCode = i18n.language;
    const current = LANGS.find(l => l.code === currentCode) || LANGS[0];

    const toggle = () => setOpen(o => !o);
    const select = (code) => {
        i18n.changeLanguage(code);
        setOpen(false);
    };

    // close when you click outside
    useEffect(() => {
        const onClick = e => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, []);

    return (
        <div className="lang-selector" ref={ref}>
            <button type="button" className="lang-toggle" onClick={toggle}>
                {current.label} <span className="caret">▾</span>
            </button>
            {open && (
                <ul className="lang-menu">
                    {LANGS.map(({ code, label }) => (
                        <li key={code}>
                            <button
                                type="button"
                                className={code === currentCode ? 'active' : ''}
                                onClick={() => select(code)}
                            >
                                {label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
