import { useState, useEffect } from 'react';
import './ExamplesGallery.css';

export default function ExamplesGallery({ onLoad }) {
    const [examples, setExamples] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const PAGE_SIZE = 12;

    useEffect(() => {
        fetch('/examples.json')
            .then((r) => r.json())
            .then((data) => {
                setExamples(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filtered = examples.filter((ex) =>
        ex.prompt?.toLowerCase().includes(search.toLowerCase())
    );

    const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(0);
    };

    return (
        <div className="gallery">
            <div className="gallery-toolbar">
                <input
                    className="gallery-search"
                    type="search"
                    placeholder="Search examples..."
                    value={search}
                    onChange={handleSearch}
                    aria-label="Search examples"
                />
                <span className="gallery-count">{filtered.length} examples</span>
            </div>

            {loading ? (
                <div className="gallery-loading">Loading examples...</div>
            ) : (
                <>
                    <div className="gallery-grid">
                        {paged.map((ex, i) => (
                            <div
                                key={i}
                                className={`gallery-card ${selected === i + page * PAGE_SIZE ? 'gallery-card--selected' : ''}`}
                                onClick={() => setSelected(i + page * PAGE_SIZE)}
                            >
                                <div className="gallery-card-preview">
                                    <iframe
                                        srcDoc={ex.response}
                                        sandbox="allow-scripts"
                                        title={ex.prompt}
                                        className="gallery-iframe"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="gallery-card-footer">
                                    <p className="gallery-card-prompt" title={ex.prompt}>
                                        {ex.prompt?.length > 60 ? ex.prompt.slice(0, 60) + '…' : ex.prompt}
                                    </p>
                                    <button
                                        className="gallery-load-btn"
                                        onClick={(e) => { e.stopPropagation(); onLoad(ex.response, ex.prompt); }}
                                        aria-label="Load this example into editor"
                                    >
                                        Load
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="gallery-pagination">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            aria-label="Previous page"
                        >
                            ← Prev
                        </button>
                        <span>{page + 1} / {totalPages}</span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            aria-label="Next page"
                        >
                            Next →
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
