import { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import './PromptSuggestions.css';

let fuseInstance = null;
let promptsCache = null;

async function getFuse() {
    if (fuseInstance) return fuseInstance;
    if (!promptsCache) {
        const res = await fetch('/prompts.json');
        promptsCache = await res.json();
    }
    fuseInstance = new Fuse(promptsCache, { threshold: 0.4, minMatchCharLength: 3 });
    return fuseInstance;
}

export default function PromptSuggestions({ query, onSelect, visible }) {
    const [suggestions, setSuggestions] = useState([]);
    const debounce = useRef(null);

    useEffect(() => {
        if (!query || query.length < 3 || !visible) { setSuggestions([]); return; }
        clearTimeout(debounce.current);
        debounce.current = setTimeout(async () => {
            const fuse = await getFuse();
            const results = fuse.search(query, { limit: 6 });
            setSuggestions(results.map((r) => r.item));
        }, 200);
        return () => clearTimeout(debounce.current);
    }, [query, visible]);

    if (!suggestions.length) return null;

    return (
        <div className="suggestions-list" role="listbox" aria-label="Prompt suggestions">
            {suggestions.map((s, i) => (
                <button
                    key={i}
                    className="suggestion-item"
                    role="option"
                    onClick={() => { onSelect(s); setSuggestions([]); }}
                    title={s}
                >
                    <span className="suggestion-icon">💡</span>
                    <span className="suggestion-text">{s.length > 80 ? s.slice(0, 80) + '…' : s}</span>
                </button>
            ))}
        </div>
    );
}
