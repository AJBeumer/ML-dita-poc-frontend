// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css'; // Optional, for additional header styling

function Header() {
    return (
        <header className="header">
            <nav className="nav">
                <Link to="/" className="home-link">Home</Link>
            </nav>
        </header>
    );
}

export default Header;
