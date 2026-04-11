import { useState, useCallback, useRef, useEffect } from 'react';
import PromptInput from './components/PromptInput';
import CodeEditor from './components/CodeEditor';
import LivePreview from './components/LivePreview';
import TabBar from './components/TabBar';
import ExportButton from './components/ExportButton';
import ExamplesGallery from './components/ExamplesGallery';
import ImprovePanel from './components/ImprovePanel';
import DeviceToolbar from './components/DeviceToolbar';
import HistorySidebar from './components/HistorySidebar';
import TemplatesPanel from './components/TemplatesPanel';
import ResizableSplit from './components/ResizableSplit';
import CommandPalette from './components/CommandPalette';
import FullscreenPreview from './components/FullscreenPreview';
import ValidationPanel from './components/ValidationPanel';
import CollabBar from './components/CollabBar';
import ToastContainer, { toast } from './components/Toast';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useCollaboration } from './hooks/useCollaboration';
import { generateCodeStream, improveCode, getActiveModel } from './services/openai';
import './App.css';

let nextId = 2;
function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function App() {
  const [tabs, setTabs] = useLocalStorage('gcp-tabs', [{ id: 1, title: 'Tab 1', code: '', prompt: '' }]);
  const [activeTab, setActiveTab] = useLocalStorage('gcp-active-tab', 1);
  const [isLoading, setIsLoading] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('editor');
  const [undoStack, setUndoStack] = useState({});
  const [genHistory, setGenHistory] = useLocalStorage('gcp-history', []);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [device, setDevice] = useState('desktop');
  const [zoom, setZoom] = useState(100);
  const [darkCanvas, setDarkCanvas] = useState(false);
  const [topCollapsed, setTopCollapsed] = useState(false);
  // Collaboration
  const [collabEnabled, setCollabEnabled] = useState(false);
  const [roomId, setRoomId] = useState('default-room');
  const editorRef = useRef(null);
  const promptInputRef = useRef(null);

  const { connected, peers, user } = useCollaboration(
    roomId,
    { current: editorRef.current?.getEditor?.() },
    collabEnabled
  );

  const activeTabData = tabs.find((t) => t.id === activeTab) || tabs[0];

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowPalette((s) => !s); }
      if (e.key === 'f' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (activeTabData?.code) setShowFullscreen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTabData]);

  const pushUndo = useCallback((tabId, code) => {
    setUndoStack((prev) => ({ ...prev, [tabId]: [...(prev[tabId] || []).slice(-20), code] }));
  }, []);

  const updateTabCode = useCallback((id, code) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, code } : t)));
  }, [setTabs]);

  const handleGenerate = async (prompt) => {
    setIsLoading(true);
    setError(null);
    const title = prompt.length > 22 ? prompt.slice(0, 22) + '...' : prompt;
    pushUndo(activeTab, activeTabData?.code || '');
    try {
      let finalCode = '';
      await generateCodeStream(prompt, (partial) => {
        finalCode = partial;
        setTabs((prev) => prev.map((t) => (t.id === activeTab ? { ...t, code: partial, title, prompt } : t)));
      });
      setGenHistory((h) => [...h.slice(-49), { code: finalCode, prompt, time: timestamp() }]);
      toast('Code generated', 'success');
    } catch (err) {
      setError(err.message || 'Generation failed.');
      toast(err.message || 'Generation failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImprove = async (instruction) => {
    if (!activeTabData?.code) return;
    setIsImproving(true);
    setError(null);
    try {
      pushUndo(activeTab, activeTabData.code);
      const code = await improveCode(activeTabData.code, instruction);
      setTabs((prev) => prev.map((t) => (t.id === activeTab ? { ...t, code } : t)));
      setGenHistory((h) => [...h.slice(-49), { code, prompt: 'Refine: ' + instruction, time: timestamp() }]);
      toast('Code refined', 'success');
    } catch (err) {
      setError(err.message || 'Improvement failed.');
      toast(err.message || 'Improvement failed', 'error');
    } finally {
      setIsImproving(false);
    }
  };

  const handleUndo = useCallback(() => {
    const stack = undoStack[activeTab] || [];
    if (!stack.length) { toast('Nothing to undo', 'info'); return; }
    const prev = stack[stack.length - 1];
    setUndoStack((u) => ({ ...u, [activeTab]: stack.slice(0, -1) }));
    updateTabCode(activeTab, prev);
    toast('Undone', 'info');
  }, [undoStack, activeTab, updateTabCode]);

  const handleLoadExample = (code, prompt) => {
    const title = prompt?.length > 22 ? prompt.slice(0, 22) + '...' : (prompt || 'Example');
    pushUndo(activeTab, activeTabData?.code || '');
    setTabs((prev) => prev.map((t) => (t.id === activeTab ? { ...t, code, title, prompt: prompt || '' } : t)));
    setView('editor');
    toast('Example loaded', 'success');
  };

  const handleRestoreHistory = (item) => {
    pushUndo(activeTab, activeTabData?.code || '');
    const title = item.prompt?.length > 22 ? item.prompt.slice(0, 22) + '...' : item.prompt;
    setTabs((prev) => prev.map((t) => (t.id === activeTab ? { ...t, code: item.code, title } : t)));
    setShowHistory(false);
    toast('History restored', 'success');
  };

  const handleTemplateSelect = (prompt) => {
    promptInputRef.current?.setPrompt(prompt);
    setShowTemplates(false);
    setTopCollapsed(false);
    toast('Template loaded', 'info');
  };

  const addTab = () => {
    const id = nextId++;
    setTabs((prev) => [...prev, { id, title: 'Tab ' + id, code: '', prompt: '' }]);
    setActiveTab(id);
  };

  const closeTab = (id) => {
    setTabs((prev) => {
      const remaining = prev.filter((t) => t.id !== id);
      if (activeTab === id) setActiveTab(remaining[remaining.length - 1].id);
      return remaining;
    });
    setUndoStack((u) => { const n = { ...u }; delete n[id]; return n; });
  };

  const doExport = () => {
    const blob = new Blob([activeTabData?.code || ''], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'component.html';
    a.click();
    toast('Exported', 'success');
  };

  const canUndo = (undoStack[activeTab] || []).length > 0;

  const commands = [
    { id: 'undo', icon: '↩', label: 'Undo Last Change', shortcut: 'Ctrl+Z', action: handleUndo },
    { id: 'fullscreen', icon: '⛶', label: 'Fullscreen Preview', shortcut: 'F', action: () => activeTabData?.code && setShowFullscreen(true) },
    { id: 'export', icon: '↓', label: 'Export HTML', action: doExport },
    { id: 'validate', icon: '🔍', label: 'Toggle Validator Panel', action: () => setShowValidation((s) => !s) },
    { id: 'collab', icon: '👥', label: 'Toggle Collaboration', action: () => setCollabEnabled((s) => !s) },
    { id: 'newtab', icon: '+', label: 'New Tab', action: addTab },
    { id: 'history', icon: '🕐', label: 'Toggle History Sidebar', action: () => setShowHistory((s) => !s) },
    { id: 'templates', icon: '📋', label: 'Open Templates', action: () => setShowTemplates((s) => !s) },
    { id: 'examples', icon: '⊞', label: 'Browse Examples Gallery', action: () => setView((v) => v === 'gallery' ? 'editor' : 'gallery') },
    { id: 'collapse', icon: '▲', label: 'Toggle Prompt Panel', action: () => setTopCollapsed((s) => !s) },
    { id: 'desktop', icon: '🖥', label: 'Preview: Desktop', action: () => setDevice('desktop') },
    { id: 'tablet', icon: '📱', label: 'Preview: Tablet', action: () => setDevice('tablet') },
    { id: 'mobile', icon: '📲', label: 'Preview: Mobile', action: () => setDevice('mobile') },
    { id: 'darkcanvas', icon: '🌙', label: 'Toggle Dark Preview Canvas', action: () => setDarkCanvas((s) => !s) },
  ];

  const previewPane = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <DeviceToolbar
        device={device} onDevice={setDevice}
        zoom={zoom} onZoom={setZoom}
        darkCanvas={darkCanvas} onToggleCanvas={() => setDarkCanvas((d) => !d)}
      />
      <LivePreview
        code={activeTabData?.code || ''}
        device={device} zoom={zoom} darkCanvas={darkCanvas}
        onFullscreen={() => setShowFullscreen(true)}
      />
    </div>
  );

  const editorPane = (
    <CodeEditor
      ref={editorRef}
      code={activeTabData?.code || ''}
      onChange={(code) => updateTabCode(activeTab, code)}
    />
  );

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-icon" aria-hidden="true">⚡</span>
          <span className="logo-text">Generative Code Playground</span>
          <span className="model-badge" title="Active model">{getActiveModel()}</span>
        </div>
        <div className="app-header-actions">
          <button className="hdr-btn palette-hint" onClick={() => setShowPalette(true)} title="Command Palette (Ctrl+K)">
            ⌘ <span>Ctrl+K</span>
          </button>
          <button className={`hdr-btn ${view === 'gallery' ? 'hdr-btn--active' : ''}`} onClick={() => setView((v) => v === 'gallery' ? 'editor' : 'gallery')}>
            ⊞ Examples
          </button>
          <button className={`hdr-btn ${showTemplates ? 'hdr-btn--active' : ''}`} onClick={() => { setShowTemplates((s) => !s); setShowHistory(false); }}>
            📋 Templates
          </button>
          <button className={`hdr-btn ${showValidation ? 'hdr-btn--active' : ''}`} onClick={() => setShowValidation((s) => !s)}>
            🔍 Validate
          </button>
          <button className={`hdr-btn ${showHistory ? 'hdr-btn--active' : ''}`} onClick={() => { setShowHistory((s) => !s); setShowTemplates(false); }}>
            🕐 History {genHistory.length > 0 && <span className="badge">{genHistory.length}</span>}
          </button>
          <button className="hdr-btn" onClick={handleUndo} disabled={!canUndo}>↩ Undo</button>
          <ExportButton code={activeTabData?.code} filename={(activeTabData?.title || 'component').replace(/[^a-z0-9]/gi, '_') + '.html'} />
        </div>
      </header>

      {/* Templates */}
      {showTemplates && view === 'editor' && (
        <div style={{ position: 'relative' }}>
          <TemplatesPanel onSelect={handleTemplateSelect} onClose={() => setShowTemplates(false)} />
        </div>
      )}

      {/* Prompt toggle */}
      {view === 'editor' && (
        <button className="top-panel-toggle" onClick={() => setTopCollapsed((c) => !c)}>
          {topCollapsed ? '▼ Show Prompt' : '▲ Hide Prompt'}
        </button>
      )}

      {/* Prompt + Refine */}
      {view === 'editor' && (
        <div className={`top-panel ${topCollapsed ? 'top-panel--collapsed' : 'top-panel--expanded'}`}>
          <PromptInput ref={promptInputRef} onGenerate={handleGenerate} isLoading={isLoading} />
          <ImprovePanel onImprove={handleImprove} isLoading={isImproving} hasCode={!!activeTabData?.code} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-banner" role="alert">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Main workspace */}
      {view === 'editor' ? (
        <>
          <TabBar tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} onAdd={addTab} onClose={closeTab} />
          <div className="workspace">
            <ResizableSplit left={editorPane} right={previewPane} />
            {showValidation && (
              <ValidationPanel
                code={activeTabData?.code || ''}
                prompt={activeTabData?.prompt || ''}
                onCodeUpdate={(code) => updateTabCode(activeTab, code)}
              />
            )}
            {showHistory && (
              <HistorySidebar history={genHistory} onRestore={handleRestoreHistory} onClose={() => setShowHistory(false)} />
            )}
          </div>
          {/* Collaboration status bar */}
          <CollabBar
            enabled={collabEnabled}
            connected={connected}
            peers={peers}
            user={user}
            roomId={roomId}
            onToggle={() => setCollabEnabled((s) => !s)}
            onRoomChange={setRoomId}
          />
        </>
      ) : (
        <div className="gallery-view">
          <ExamplesGallery onLoad={handleLoadExample} />
        </div>
      )}

      {/* Overlays */}
      {showPalette && <CommandPalette commands={commands} onClose={() => setShowPalette(false)} />}
      {showFullscreen && <FullscreenPreview code={activeTabData?.code || ''} onClose={() => setShowFullscreen(false)} />}
      <ToastContainer />
    </div>
  );
}
