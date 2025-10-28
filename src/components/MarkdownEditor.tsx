import React, { useEffect, useRef } from 'react';
import { Remarkable } from 'remarkable';

declare const Prism: any;

const md = new Remarkable({
    html: true,
    typographer: true,
    highlight: function (str, lang) {
        if (lang && typeof Prism !== 'undefined' && Prism.languages[lang]) {
            try {
                return Prism.highlight(str, Prism.languages[lang], lang);
            } catch (e) {
                // No-op
            }
        }
        return '';
    },
});

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (previewRef.current) {
            previewRef.current.innerHTML = md.render(value);
            if (typeof Prism !== 'undefined') {
                Prism.highlightAllUnder(previewRef.current);
            }
        }
    }, [value]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[60vh] border rounded-lg dark:border-gray-700">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-full p-3 border-r dark:border-gray-700 rounded-l-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent font-mono text-sm bg-gray-50 dark:bg-charcoal-900/50 dark:text-gray-200"
                spellCheck="false"
            />
            <div
                ref={previewRef}
                className="w-full h-full p-4 overflow-y-auto prose dark:prose-invert max-w-none"
            />
        </div>
    );
};