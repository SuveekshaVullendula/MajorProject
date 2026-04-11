import { useState, useRef, useCallback } from 'react';
import './ResizableSplit.css';

export default function ResizableSplit({ left, right }) {
    const [splitPct, setSplitPct] = useState(50);
    const containerRef = useRef(null);
    const dragging = useRef(false);

    const onMouseDown = useCallback((e) => {
        e.preventDefault();
        dragging.current = true;

        const onMove = (e) => {
            if (!dragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            setSplitPct(Math.min(80, Math.max(20, pct)));
        };

        const onUp = () => {
            dragging.current = false;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, []);

    return (
        <div className="resizable-split" ref={containerRef}>
            <div className="split-pane" style={{ width: `${splitPct}%` }}>
                {left}
            </div>
            <div
                className="split-divider"
                onMouseDown={onMouseDown}
                title="Drag to resize"
                role="separator"
                aria-label="Resize panels"
            >
                <div className="split-handle" />
            </div>
            <div className="split-pane" style={{ width: `${100 - splitPct}%` }}>
                {right}
            </div>
        </div>
    );
}
