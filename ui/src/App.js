// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicationsList from './components/PublicationsList';
import PublicationPage from './components/PublicationPage';
import ContentPage from './components/ContentPage';
import Header from './components/Header';
import './App.css';

function App() {
    return (
        <Router>
            <Header />
            <Routes>
                <Route path="/" element={<PublicationsList />} />
                <Route path="/:programme/:publicationName/*" element={<PublicationPage />}>
                    <Route path="topic/:topicId" element={<ContentPage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
