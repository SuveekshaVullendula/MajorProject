import './ExportButton.css';

export default function ExportButton({ code, filename = 'component.html' }) {
    const handleExport = () => {
        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <button
            className="export-btn"
            onClick={handleExport}
            disabled={!code}
            aria-label="Export code as HTML file"
            title="Download as HTML"
        >
            ↓ Export HTML
        </button>
    );
}
