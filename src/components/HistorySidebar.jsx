import './HistorySidebar.css';

export default function HistorySidebar({ history, onRestore, onClose }) {
    const reversed = [...history].reverse();

    return (
        <div className="history-sidebar">
            {/* Header */}
            <div className="history-header">
                <div className="history-header-left">
                    <span className="history-title">Generation History</span>
                    <span className="history-count">{history.length}</span>
                </div>
                <button className="history-close" onClick={onClose} aria-label="Close history">✕</button>
            </div>

            {/* List */}
            {history.length === 0 ? (
                <div className="history-empty">
                    <span className="history-empty-icon">🕐</span>
                    <span>No history yet.</span>
                    <span>Generate some code to see it here.</span>
                </div>
            ) : (
                <div className="history-list">
                    {reversed.map((item, i) => (
                        <div key={i} className="history-card">
                            {/* Mini preview */}
                            <div className="history-preview">
                                <iframe
                                    srcDoc={item.code}
                                    sandbox="allow-scripts"
                                    title={item.prompt}
                                    className="history-iframe"
                                    loading="lazy"
                                />
                            </div>

                            {/* Info */}
                            <div className="history-info">
                                <p className="history-prompt" title={item.prompt}>
                                    {item.prompt?.length > 55
                                        ? item.prompt.slice(0, 55) + '…'
                                        : item.prompt}
                                </p>
                                <div className="history-meta">
                                    <span className="history-time">🕐 {item.time}</span>
                                    <button
                                        className="history-restore"
                                        onClick={() => onRestore(item)}
                                    >
                                        Restore
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
