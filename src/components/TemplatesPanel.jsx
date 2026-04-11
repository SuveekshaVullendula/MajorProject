import { useState } from 'react';
import './TemplatesPanel.css';

const TEMPLATES = {
    'Landing Pages': [
        'Create a hero section with a bold headline, subtext, and two CTA buttons',
        'Build a features section with 3 icon cards in a grid layout',
        'Design a pricing table with 3 tiers: Free, Pro, and Enterprise',
        'Create a testimonials section with 3 customer quotes and avatars',
    ],
    'Navigation': [
        'Design a responsive navbar with logo, nav links, and a CTA button',
        'Build a sidebar navigation with icons and labels',
        'Create a sticky top navigation bar with a dropdown menu',
        'Design a mobile hamburger menu layout',
    ],
    'Forms': [
        'Build a login form with email, password fields and a submit button',
        'Create a registration form with name, email, password, and confirm password',
        'Design a contact form with name, email, subject, message and submit',
        'Build a newsletter subscription form with email input and button',
    ],
    'Cards': [
        'Generate a product card with image, title, price, and add to cart button',
        'Create a blog post card with thumbnail, category, title, excerpt, and read more',
        'Design a team member card with photo, name, role, and social links',
        'Build a stats card showing a metric, trend indicator, and sparkline area',
    ],
    'Layouts': [
        'Create a two-column layout with sidebar and main content area',
        'Build a responsive CSS grid gallery with 4 columns',
        'Design a dashboard layout with header, sidebar, and content area',
        'Create a footer with 4 columns: logo, links, social, newsletter',
    ],
};

export default function TemplatesPanel({ onSelect, onClose }) {
    const [activeCategory, setActiveCategory] = useState('Landing Pages');

    return (
        <div className="templates-panel">
            <div className="templates-header">
                <span>Prompt Templates</span>
                <button onClick={onClose} aria-label="Close templates">×</button>
            </div>
            <div className="templates-body">
                <div className="templates-categories">
                    {Object.keys(TEMPLATES).map((cat) => (
                        <button
                            key={cat}
                            className={`cat-btn ${activeCategory === cat ? 'cat-btn--active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="templates-list">
                    {TEMPLATES[activeCategory].map((t, i) => (
                        <button
                            key={i}
                            className="template-item"
                            onClick={() => { onSelect(t); onClose(); }}
                        >
                            <span className="template-arrow">→</span>
                            {t}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
