'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface CodePlaygroundProps {
  initialCode?: string;
}

export default function CodePlayground({ initialCode = '' }: CodePlaygroundProps) {
  const [html, setHtml] = useState(initialCode || `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Playground</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="p-8">
  <h1 class="text-2xl font-bold mb-4">Test Your Accessibility Fixes</h1>
  
  <!-- Add your code here -->
  <button class="bg-blue-500 text-white px-4 py-2 rounded">
    Click me
  </button>
</body>
</html>`);

  const [preview, setPreview] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setPreview(html);
    }, 500);
    return () => clearTimeout(timer);
  }, [html]);

  return (
    <div className="grid grid-cols-2 gap-4 h-[600px]">
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-800 text-white px-4 py-2 text-sm font-semibold">
          HTML Editor
        </div>
        <Editor
          height="calc(100% - 40px)"
          defaultLanguage="html"
          value={html}
          onChange={(value) => setHtml(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-800 text-white px-4 py-2 text-sm font-semibold">
          Live Preview
        </div>
        <iframe
          srcDoc={preview}
          title="Preview"
          className="w-full h-full bg-white"
          sandbox="allow-scripts"
        />
      </div>
    </div>
  );
}
