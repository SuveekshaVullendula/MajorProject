import { useState } from 'react';
import { verifyAgainstPrompt } from '../services/yoloVerifier';
import { iterativeRefine } from '../services/iterativeRefine';
import { toast } from './Toast';
import './ValidationPanel.css';

const STATUS_ICON = { pass: '✓', fail: '✗', partial: '◑' };
const STATUS_CLASS = { pass: 'req--pass', fail: 'req--fail', partial: 'req--partial' };

export default function ValidationPanel({ code, prompt, onCodeUpdate }) {
    const [result, setResult] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [refining, setRefining] = useState(false);
    const [iterations, setIterations] = useState([]);

    const handleVerify = async () => {
        if (!code) { toast('No code to verify', 'info'); return; }
        if (!prompt) { toast('Generate code from a prompt first', 'info'); return; }
        setVerifying(true);
        setResult(null);
        setIterations([]);
        try {
            const r = await verifyAgainstPrompt(prompt, code);
            setResult(r);
            toast(r.passed ? 'Verification passed ✓' : 'Issues found — try Auto-Fix', r.passed ? 'success' : 'info');
        } catch (e) {
            toast('Verification failed: ' + e.message, 'error');
        } finally {
            setVerifying(false);
        }
    };

    const handleAutoFix = async () => {
        if (!code) { toast('No code to fix', 'info'); return; }
        if (!prompt) { toast('Need a prompt to verify against', 'info'); return; }
        setRefining(true);
        setResult(null);
        setIterations([]);
        try {
            const log = [];
            const { code: fixedCode, result: finalResult } = await iterativeRefine(
                code,
                prompt,
                (iter, newCode, res) => {
                    log.push({ iter, score: res.score, passed: res.passed, raw: res.raw });
                    setIterations([...log]);
                    // Push updated code to editor on every iteration > 0
                    if (iter > 0) onCodeUpdate(newCode);
                }
            );
            setResult(finalResult.raw ?? finalResult);
            toast(
                finalResult.passed
                    ? `Auto-fix complete — passed in ${log.length - 1} iteration(s)`
                    : `Auto-fix done — best score: ${log[log.length - 1]?.score}/100`,
                finalResult.passed ? 'success' : 'info'
            );
        } catch (e) {
            toast('Auto-fix failed: ' + e.message, 'error');
        } finally {
            setRefining(false);
        }
    };

    const scoreColor = !result ? '#6c7086'
        : (result.overallScore ?? 0) >= 85 ? '#a6e3a1'
            : (result.overallScore ?? 0) >= 60 ? '#f9e2af'
                : '#f38ba8';

    const busy = verifying || refining;

    return (
        <div className="validation-panel">
            <div className="validation-header">
                <span className="validation-title">🎯 YOLO Verifier</span>
                <div className="validation-actions">
                    <button className="val-btn" onClick={handleVerify} disabled={busy || !code}>
                        {verifying
                            ? <><span className="val-spinner" /> Verifying...</>
                            : 'Verify'}
                    </button>
                    <button className="val-btn val-btn--fix" onClick={handleAutoFix} disabled={busy || !code}>
                        {refining
                            ? <><span className="val-spinner" /> Fixing...</>
                            : '⚡ Auto-Fix'}
                    </button>
                </div>
            </div>

            {/* Prompt context */}
            {prompt ? (
                <div className="val-prompt-box">
                    <span className="val-prompt-label">Verifying against prompt:</span>
                    <span className="val-prompt-text">{prompt.length > 90 ? prompt.slice(0, 90) + '…' : prompt}</span>
                </div>
            ) : (
                <div className="val-prompt-box val-prompt-box--warn">
                    ⚠ Generate code from a prompt first to enable verification
                </div>
            )}

            {/* Iteration progress (shown while refining or after) */}
            {iterations.length > 0 && (
                <div className="iteration-log">
                    <span className="section-title">
                        {refining ? '⟳ Refining...' : 'Refinement Log'}
                    </span>
                    {iterations.map((it, i) => (
                        <div key={i} className="iteration-row">
                            <span className="iter-badge">#{it.iter}</span>
                            <div className="iter-bar-wrap">
                                <div
                                    className="iter-bar"
                                    style={{
                                        width: it.score + '%',
                                        background: it.passed ? '#a6e3a1' : it.score >= 60 ? '#f9e2af' : '#f38ba8',
                                    }}
                                />
                            </div>
                            <span className="iter-score">{it.score}</span>
                            {it.passed && <span className="iter-pass">✓</span>}
                        </div>
                    ))}
                </div>
            )}

            {result && (
                <div className="validation-body">

                    {/* Score */}
                    <div className="score-row">
                        <div className="score-circle" style={{ '--score-color': scoreColor }}>
                            <span className="score-num" style={{ color: scoreColor }}>{result.overallScore}</span>
                            <span className="score-label">/ 100</span>
                        </div>
                        <div className="score-info">
                            <span className="score-summary" style={{ color: scoreColor }}>{result.summary}</span>
                            <span className="score-threshold">
                                {result.passed ? '✓ Meets requirements' : '✗ Does not fully meet requirements'}
                            </span>
                        </div>
                    </div>

                    {/* Detected components */}
                    {result.detectedComponents?.length > 0 && (
                        <div className="detected-section">
                            <span className="section-title">Detected UI Components</span>
                            <div className="component-tags">
                                {result.detectedComponents.map((c, i) => (
                                    <span key={i} className="component-tag">{c}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Per-requirement results */}
                    {result.requirements?.length > 0 && (
                        <div className="requirements-section">
                            <span className="section-title">Requirements Check</span>
                            <div className="requirements-list">
                                {result.requirements.map((r, i) => (
                                    <div key={i} className={`req-item ${STATUS_CLASS[r.status] || 'req--fail'}`}>
                                        <span className="req-icon">{STATUS_ICON[r.status] || '✗'}</span>
                                        <div className="req-content">
                                            <span className="req-text">{r.requirement}</span>
                                            {r.reason && <span className="req-reason">{r.reason}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Missing elements */}
                    {result.missingElements?.length > 0 && (
                        <div className="missing-section">
                            <span className="section-title">Missing Elements</span>
                            {result.missingElements.map((m, i) => (
                                <div key={i} className="missing-item">✗ {m}</div>
                            ))}
                        </div>
                    )}

                    {/* Extra elements */}
                    {result.extraElements?.length > 0 && (
                        <div className="extra-section">
                            <span className="section-title">Extra (not requested)</span>
                            {result.extraElements.map((e, i) => (
                                <div key={i} className="extra-item">+ {e}</div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {!result && !busy && iterations.length === 0 && (
                <div className="validation-empty">
                    Click <strong>Verify</strong> to check if the generated code matches your prompt requirements.<br /><br />
                    Click <strong>⚡ Auto-Fix</strong> to automatically refine the code until all requirements are met.
                </div>
            )}
        </div>
    );
}
