import { useState, useCallback, useEffect, useRef } from 'react';
import './Toast.css';

let _addToast = null;

export function toast(message, type = 'info') {
    _addToast?.({ message, type, id: Date.now() + Math.random() });
}

export default function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    const add = useCallback((t) => {
        setToasts((prev) => [...prev.slice(-4), t]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((x) => x.id !== t.id));
        }, 3200);
    }, []);

    useEffect(() => { _addToast = add; return () => { _addToast = null; }; }, [add]);

    return (
        <div className="toast-container" aria-live="polite">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast--${t.type}`}>
                    <span className="toast-icon">
                        {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
                    </span>
                    {t.message}
                </div>
            ))}
        </div>
    );
}
