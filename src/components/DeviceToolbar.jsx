import './DeviceToolbar.css';

const DEVICES = [
    { id: 'desktop', label: 'Desktop', icon: '🖥', width: '100%' },
    { id: 'tablet', label: 'Tablet', icon: '📱', width: '768px' },
    { id: 'mobile', label: 'Mobile', icon: '📲', width: '375px' },
];

export default function DeviceToolbar({ device, onDevice, zoom, onZoom, darkCanvas, onToggleCanvas }) {
    return (
        <div className="device-toolbar">
            <div className="device-btns">
                {DEVICES.map((d) => (
                    <button
                        key={d.id}
                        className={`device-btn ${device === d.id ? 'device-btn--active' : ''}`}
                        onClick={() => onDevice(d.id)}
                        title={d.label}
                        aria-label={d.label}
                    >
                        {d.icon} <span>{d.label}</span>
                    </button>
                ))}
            </div>
            <div className="device-toolbar-right">
                <button
                    className={`canvas-toggle ${darkCanvas ? 'canvas-toggle--dark' : ''}`}
                    onClick={onToggleCanvas}
                    title="Toggle preview background"
                    aria-label="Toggle preview background"
                >
                    {darkCanvas ? '☀ Light BG' : '🌙 Dark BG'}
                </button>
                <div className="zoom-control">
                    <button onClick={() => onZoom(Math.max(25, zoom - 25))} aria-label="Zoom out">−</button>
                    <span>{zoom}%</span>
                    <button onClick={() => onZoom(Math.min(150, zoom + 25))} aria-label="Zoom in">+</button>
                </div>
            </div>
        </div>
    );
}

export { DEVICES };
