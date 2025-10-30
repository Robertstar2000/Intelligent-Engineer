import { useState, useEffect, Dispatch, SetStateAction } from 'react';

// FIX: Add Dispatch and SetStateAction types to resolve namespace error.
export const useTheme = (): [string, Dispatch<SetStateAction<string>>] => {
    const [theme, setThemeState] = useState(() => {
        if (typeof window === 'undefined') return 'dark';
        return localStorage.getItem('theme') || 'dark';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    return [theme, setThemeState];
};