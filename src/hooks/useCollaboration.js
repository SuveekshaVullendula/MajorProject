import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';

const WS_URL = import.meta.env.VITE_COLLAB_SERVER_URL || 'ws://localhost:1234';

// Generate a random user color + name for this session
function randomUser() {
  const colors = ['#f38ba8', '#a6e3a1', '#89b4fa', '#f9e2af', '#cba6f7', '#94e2d5'];
  const names  = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Hank'];
  return {
    name:  names[Math.floor(Math.random() * names.length)],
    color: colors[Math.floor(Math.random() * colors.length)],
  };
}

export function useCollaboration(roomId, monacoEditorRef, enabled) {
  const docRef      = useRef(null);
  const providerRef = useRef(null);
  const bindingRef  = useRef(null);
  const [peers, setPeers]       = useState([]);
  const [connected, setConnected] = useState(false);
  const user = useRef(randomUser());

  useEffect(() => {
    if (!enabled || !roomId || !monacoEditorRef?.current) return;

    // Create Yjs doc
    const ydoc = new Y.Doc();
    docRef.current = ydoc;

    // Connect to WebSocket server
    const provider = new WebsocketProvider(WS_URL, `gcp-room-${roomId}`, ydoc);
    providerRef.current = provider;

    // Set local awareness (cursor color + name)
    provider.awareness.setLocalStateField('user', user.current);

    provider.on('status', ({ status }) => {
      setConnected(status === 'connected');
    });

    // Track peers
    provider.awareness.on('change', () => {
      const states = Array.from(provider.awareness.getStates().values());
      setPeers(states.filter((s) => s.user).map((s) => s.user));
    });

    // Bind Yjs text to Monaco editor
    const yText   = ydoc.getText('monaco');
    const binding = new MonacoBinding(
      yText,
      monacoEditorRef.current.getModel(),
      new Set([monacoEditorRef.current]),
      provider.awareness
    );
    bindingRef.current = binding;

    return () => {
      binding.destroy();
      provider.destroy();
      ydoc.destroy();
      setConnected(false);
      setPeers([]);
    };
  }, [enabled, roomId, monacoEditorRef?.current]);

  return { connected, peers, user: user.current };
}
