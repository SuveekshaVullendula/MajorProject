import './CollabBar.css';

export default function CollabBar({ enabled, connected, peers, user, roomId, onToggle, onRoomChange }) {
    return (
        <div className="collab-bar">
            <div className="collab-left">
                <button
                    className={`collab-toggle ${enabled ? 'collab-toggle--on' : ''}`}
                    onClick={onToggle}
                    title={enabled ? 'Disable collaboration' : 'Enable collaboration'}
                >
                    <span className={`collab-dot ${connected ? 'collab-dot--live' : ''}`} />
                    {enabled ? (connected ? 'Live' : 'Connecting...') : 'Collaborate'}
                </button>

                {enabled && (
                    <div className="collab-room">
                        <span className="collab-room-label">Room:</span>
                        <input
                            className="collab-room-input"
                            value={roomId}
                            onChange={(e) => onRoomChange(e.target.value)}
                            placeholder="room-id"
                            aria-label="Collaboration room ID"
                        />
                    </div>
                )}
            </div>

            {enabled && (
                <div className="collab-right">
                    {peers.length > 0 && (
                        <div className="collab-peers">
                            {peers.slice(0, 5).map((p, i) => (
                                <div
                                    key={i}
                                    className="peer-avatar"
                                    style={{ background: p.color }}
                                    title={p.name}
                                >
                                    {p.name?.[0] || '?'}
                                </div>
                            ))}
                            {peers.length > 5 && (
                                <div className="peer-avatar peer-avatar--more">+{peers.length - 5}</div>
                            )}
                        </div>
                    )}
                    <div className="collab-you" style={{ borderColor: user.color }}>
                        <span style={{ color: user.color }}>You: {user.name}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
