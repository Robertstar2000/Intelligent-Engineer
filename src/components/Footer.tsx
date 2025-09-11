import React from 'react';

export const Footer = () => {
    return (
        <footer className="py-8 border-t border-charcoal-700/50">
            <div className="container mx-auto text-center text-gray-500">
                <p>&copy; {new Date().getFullYear()} Intelligent Engineering. All rights reserved.</p>
            </div>
        </footer>
    )
}
