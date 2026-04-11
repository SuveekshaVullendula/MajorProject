import { useState, useEffect, useRef } from 'react';
import './CommandPalette.css';

export default function CommandPalette({ commands, onClose }) {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);
    const [selected, setSelected] = useState(0);

    const filtered = commands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => { inputRef.current?.focus(); }, []);
    useEffect(() => { setSelected(0); }, [query]);

    const run = (cmd) => { cmd.action(); onClose(); };

    const onKey = (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
        if (e.key === 'Enter' && filtered[selected]) run(filtered[selected]);
        if (e.key === 'Escape') onClose();
    };

    return (
        <div className="palette-overlay" onClick={onClose}>
            <div className="palette" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Command palette">
                <div className="palette-search">
                    <span className="palette-icon">⌘</span>
                    <input
                        ref={inputRef}
                        className="palette-input"
                        placeholder="Type a command..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={onKey}
                        aria-label="Search commands"
                    />
                    <kbd className="palette-esc">ESC</kbd>
                </div>
                <div className="palette-list">
                    {filtered.length === 0 && (
                        <div className="palette-empty">No commands found</div>
                    )}
                    {filtered.map((cmd, i) => (
                        <button
                            key={cmd.id}
                            className={`palette-item ${i === selected ? 'palette-item--selected' : ''}`}
                            onClick={() => run(cmd)}
                            onMouseEnter={() => setSelected(i)}
                        >
                            <span className="palette-item-icon">{cmd.icon}</span>
                            <span className="palette-item-label">{cmd.label}</span>
                            {cmd.shortcut && <kbd className="palette-shortcut">{cmd.shortcut}</kbd>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
