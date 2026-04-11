import './TabBar.css';

export default function TabBar({ tabs, activeTab, onSelect, onAdd, onClose }) {
    return (
        <div className="tab-bar" role="tablist" aria-label="Code tabs">
            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    className={`tab ${activeTab === tab.id ? 'tab--active' : ''}`}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => onSelect(tab.id)}
                >
                    <span className="tab-title" title={tab.title}>{tab.title}</span>
                    {tabs.length > 1 && (
                        <button
                            className="tab-close"
                            onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
                            aria-label={`Close tab ${tab.title}`}
                        >
                            ×
                        </button>
                    )}
                </div>
            ))}
            <button className="tab-add" onClick={onAdd} aria-label="Add new tab" title="New tab">
                +
            </button>
        </div>
    );
}
