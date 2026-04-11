import { useRef, forwardRef, useImperativeHandle } from 'react';
import Editor from '@monaco-editor/react';
import './CodeEditor.css';

function extractCSS(code) {
    const match = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    return match ? match[1].trim() : '';
}

function extractHTML(code) {
    return code.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').trim();
}

async function formatCode(code) {
    try {
        const prettier = await import('prettier/standalone');
        const htmlPlugin = await import('prettier/plugins/html');
        return await prettier.default.format(code, {
            parser: 'html',
            plugins: [htmlPlugin.default],
            printWidth: 80,
            tabWidth: 2,
        });
    } catch {
        return code;
    }
}

const CodeEditor = forwardRef(function CodeEditor({ code, onChange }, ref) {
    const editorRef = useRef(null);

    useImperativeHandle(ref, () => ({
        getEditor: () => editorRef.current,
    }));

    const handleFormat = async () => {
        const formatted = await formatCode(code);
        onChange(formatted);
    };

    const copyAll = () => navigator.clipboard.writeText(code);
    const copyCSS = () => navigator.clipboard.writeText(extractCSS(code));
    const copyHTML = () => navigator.clipboard.writeText(extractHTML(code));

    return (
        <div className="editor-wrapper">
            <div className="editor-header">
                <span className="editor-label">HTML / CSS</span>
                <div className="editor-actions">
                    <button className="editor-btn" onClick={handleFormat} title="Format code">⌥ Format</button>
                    <button className="editor-btn" onClick={copyHTML} title="Copy HTML only">Copy HTML</button>
                    <button className="editor-btn" onClick={copyCSS} title="Copy CSS only">Copy CSS</button>
                    <button className="editor-btn editor-btn--primary" onClick={copyAll} title="Copy all">Copy All</button>
                </div>
            </div>
            <Editor
                height="100%"
                defaultLanguage="html"
                theme="vs-dark"
                value={code}
                onChange={(val) => onChange(val || '')}
                onMount={(editor) => { editorRef.current = editor; }}
                options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    formatOnPaste: true,
                    lineNumbers: 'on',
                    folding: true,
                    bracketPairColorization: { enabled: true },
                }}
            />
        </div>
    );
});

export default CodeEditor;
