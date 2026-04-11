import { useRef, useEffect, useState } from 'react';
import { DEVICES } from './DeviceToolbar';
import { toast } from './Toast';
import './LivePreview.css';

export default function LivePreview({ code, device, zoom, darkCanvas, onFullscreen }) {
    const iframeRef = useRef(null);
    const [iframeHeight, setIframeHeight] = useState(500);
    const deviceWidth = DEVICES.find((d) => d.id === device)?.width || '100%';

    // Resize iframe to match its content height
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const onLoad = () => {
            try {
                const h = iframe.contentDocument?.documentElement?.scrollHeight;
                if (h && h > 100) setIframeHeight(h);
            } catch { }
        };
        iframe.addEventListener('load', onLoad);
        return () => iframe.removeEventListener('load', onLoad);
    }, [code]);

    const handleOpen = () => {
        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        toast('Opened in new tab', 'info');
    };

    const emptyDoc = `<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:${darkCanvas ? '#1e1e2e' : '#f8f8f8'};color:#6c7086;font-family:sans-serif;font-size:14px;flex-direction:column;gap:8px;"><span style="font-size:32px">⚡</span><span>Generate something to preview it here</span></body></html>`;

    return (
        <div className={`preview-wrapper ${darkCanvas ? 'preview-wrapper--dark' : ''}`}>
            <div className="preview-header">
                <span className="preview-label">Live Preview</span>
                <div className="preview-actions">
                    <button className="preview-btn" onClick={handleOpen} title="Open in new tab" disabled={!code}>
                        ↗ Open
                    </button>
                    <button className="preview-btn preview-btn--fs" onClick={onFullscreen} title="Fullscreen (F)" disabled={!code}>
                        ⛶ Fullscreen
                    </button>
                </div>
            </div>

            {/* Scrollable canvas */}
            <div className="preview-scroll-area">
                <div
                    className="preview-device-frame"
                    style={{
                        width: deviceWidth,
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top center',
                        // account for scale shrink so container doesn't collapse
                        marginBottom: zoom < 100 ? `${-(iframeHeight * (1 - zoom / 100))}px` : 0,
                    }}
                >
                    <iframe
                        ref={iframeRef}
                        className="preview-frame"
                        title="Live Preview"
                        srcDoc={code || emptyDoc}
                        sandbox="allow-scripts"
                        style={{ height: code ? `${iframeHeight}px` : '100%' }}
                    />
                </div>
            </div>
        </div>
    );
}
