import { useState } from 'react';
import './ImprovePanel.css';

export default function ImprovePanel({ onImprove, isLoading, hasCode }) {
    const [instruction, setInstruction] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (instruction.trim()) {
            onImprove(instruction.trim());
            setInstruction('');
        }
    };

    const suggestions = [
        'Make it dark themed',
        'Add hover animations',
        'Make it fully responsive',
        'Add a gradient background',
    ];

    return (
        <div className="improve-panel">
            <span className="improve-label">Refine with AI</span>
            <form className="improve-form" onSubmit={handleSubmit}>
                <input
                    className="improve-input"
                    type="text"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="e.g. Make it dark themed, add animations..."
                    disabled={isLoading || !hasCode}
                    aria-label="Improvement instruction"
                />
                <button
                    type="submit"
                    className="improve-btn"
                    disabled={isLoading || !hasCode || !instruction.trim()}
                    aria-label="Apply improvement"
                >
                    {isLoading ? '...' : 'Apply'}
                </button>
            </form>
            <div className="improve-suggestions">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        className="improve-chip"
                        onClick={() => setInstruction(s)}
                        disabled={isLoading || !hasCode}
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
}
