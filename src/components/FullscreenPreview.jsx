import { useEffect } from 'react';
import './FullscreenPreview.css';

export default function FullscreenPreview({ code, onClose }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className="fullscreen-overlay">
            <div className="fullscreen-bar">
                <span className="fullscreen-title">Preview</span>
                <button className="fullscreen-close" onClick={onClose} aria-label="Close fullscreen">
                    ✕ Close (Esc)
                </button>
            </div>
            <iframe
                className="fullscreen-frame"
                title="Fullscreen Preview"
                srcDoc={code}
                sandbox="allow-scripts"
            />
        </div>
    );
}
