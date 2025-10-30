import React from 'react';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { UnifiedLifecycle } from '../components/UnifiedLifecycle';
import { Footer } from '../components/Footer';

export const LandingPage = ({ onLoginClick }) => {
    return (
        <div className="dark:bg-charcoal-900 text-white">
            <Header onLoginClick={onLoginClick} />
            <main>
                <Hero onLoginClick={onLoginClick} />
                <Features />
                <UnifiedLifecycle />
            </main>
            <Footer />
        </div>
    );
};
