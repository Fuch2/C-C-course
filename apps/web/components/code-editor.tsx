'use client';
import 'monaco-editor/nls/lang/ru';
import * as monaco from 'monaco-editor/editor/editor.api';
import 'monaco-editor/languages/definitions/cpp/register';
import 'monaco-editor/editor/contrib/find/browser/findController';
import 'monaco-editor/editor/contrib/bracketMatching/browser/bracketMatching';
import Editor, { loader } from '@monaco-editor/react';
import { useEffect, useRef } from 'react';

(globalThis as unknown as { MonacoEnvironment: { getWorker: () => Worker } }).MonacoEnvironment = {
  getWorker: () => new Worker('/monaco/editor.worker.js'),
};
loader.config({ monaco });
monaco.editor.defineTheme('systems', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '7E8676' },
    { token: 'string', foreground: '9FC29A' },
    { token: 'keyword', foreground: 'C2B681' },
  ],
  colors: {
    'editor.background': '#11140F',
    'editor.foreground': '#D0D5C7',
    'editorLineNumber.foreground': '#626A5C',
    'editorCursor.foreground': '#A5B474',
    'editor.lineHighlightBackground': '#1B2018',
    'editor.selectionBackground': '#3D482F',
  },
});
export default function CodeEditor({
  source,
  onChange,
  cpp,
  fontSize,
  onRun,
  disabled,
  diagnostics,
}: {
  source: string;
  onChange: (value: string) => void;
  cpp: boolean;
  fontSize: number;
  onRun: () => void;
  disabled: boolean;
  diagnostics: string;
}) {
  const instance = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const run = useRef(onRun);
  useEffect(() => {
    run.current = onRun;
  }, [onRun]);
  useEffect(() => {
    const model = instance.current?.getModel();
    if (!model) return;
    const markers: monaco.editor.IMarkerData[] = [];
    for (const line of diagnostics.split('\n')) {
      const match = /main\.(?:c|cpp):(\d+):(\d+):\s*(error|warning|note):\s*(.*)/.exec(line);
      if (match)
        markers.push({
          startLineNumber: Number(match[1]),
          endLineNumber: Number(match[1]),
          startColumn: Number(match[2]),
          endColumn: Number(match[2]) + 1,
          severity:
            match[3] === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
          message: match[4] ?? 'Сообщение компилятора',
        });
    }
    monaco.editor.setModelMarkers(model, 'compiler', markers);
  }, [diagnostics]);
  return (
    <Editor
      height="420px"
      language={cpp ? 'cpp' : 'c'}
      theme="systems"
      value={source}
      onChange={(value) => onChange(value ?? '')}
      loading={
        <div className="editor-loading" role="status">
          Загружаем редактор…
        </div>
      }
      onMount={(editor) => {
        instance.current = editor;
        editor.addAction({
          id: 'course.run',
          label: 'Запустить программу',
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
          run: () => run.current(),
        });
      }}
      options={{
        fontSize,
        fontFamily: 'SFMono-Regular, Consolas, monospace',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 18, bottom: 18 },
        tabSize: 4,
        insertSpaces: true,
        automaticLayout: true,
        wordWrap: 'on',
        readOnly: disabled,
        ariaLabel: 'Редактор исходного кода. Нажмите Escape, затем Tab для выхода из редактора.',
        accessibilitySupport: 'auto',
        tabFocusMode: true,
        contextmenu: false,
        quickSuggestions: false,
      }}
    />
  );
}
