import { useState, forwardRef, useImperativeHandle } from 'react';
import PromptSuggestions from './PromptSuggestions';
import './PromptInput.css';

const PromptInput = forwardRef(function PromptInput({ onGenerate, isLoading }, ref) {
    const [prompt, setPrompt] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    useImperativeHandle(ref, () => ({
        setPrompt: (val) => { setPrompt(val); setShowSuggestions(false); },
    }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (prompt.trim()) { onGenerate(prompt.trim()); setShowSuggestions(false); }
    };

    const examples = [
        'Create a centered hero section with a heading and a call-to-action button',
        'Design a responsive navigation bar with logo on left and menu items on right',
        'Generate a card component with image, title, description, and a Read More link',
        'Build a contact form with name, email, message fields and a submit button',
    ];

    return (
        <div className="prompt-input-container">
            <form onSubmit={handleSubmit} className="prompt-form">
                <div className="prompt-input-wrap">
                    <input
                        className="prompt-input"
                        type="text"
                        value={prompt}
                        onChange={(e) => { setPrompt(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        placeholder="Describe the UI component you want to generate..."
                        aria-label="UI component description"
                        disabled={isLoading}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e); }}
                        autoComplete="off"
                    />
                    <PromptSuggestions
                        query={prompt}
                        visible={showSuggestions}
                        onSelect={(s) => { setPrompt(s); setShowSuggestions(false); }}
                    />
                </div>
                <button
                    type="submit"
                    className="generate-btn"
                    disabled={isLoading || !prompt.trim()}
                    aria-label="Generate code"
                >
                    {isLoading && <span className="spinner" aria-hidden="true" />}
                    {isLoading ? 'Generating...' : 'Generate'}
                </button>
            </form>
            <div className="examples">
                <span className="examples-label">Try:</span>
                {examples.map((ex, i) => (
                    <button
                        key={i}
                        className="example-chip"
                        onClick={() => { setPrompt(ex); setShowSuggestions(false); }}
                        disabled={isLoading}
                        title={ex}
                    >
                        {ex.length > 46 ? ex.slice(0, 46) + '…' : ex}
                    </button>
                ))}
            </div>
        </div>
    );
});

export default PromptInput;
