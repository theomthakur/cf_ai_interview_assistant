// frontend/src/components/CodeEditor.tsx
import { useState } from 'react';
import { Play, Save, RefreshCw } from 'lucide-react';

interface CodeEditorProps {
  onSubmit: (code: string, language: string) => void;
}

type Language = 'javascript' | 'python' | 'java' | 'cpp';

export default function CodeEditor({ onSubmit }: CodeEditorProps) {
  const [code, setCode] = useState('// Write your solution here\n');
  const [language, setLanguage] = useState<Language>('javascript');
  const [output, setOutput] = useState('');
  
  const starterCode: Record<Language, string> = {
    javascript: `// Write your solution here
function solution(input) {
  // Your code here
  return result;
}`,
    python: `# Write your solution here
def solution(input):
    # Your code here
    return result`,
    java: `// Write your solution here
public class Solution {
    public static Object solution(Object input) {
        // Your code here
        return result;
    }
}`,
    cpp: `// Write your solution here
#include <iostream>
using namespace std;

int solution(int input) {
    // Your code here
    return result;
}`
  };
  
  const handleLanguageChange = (newLang: string) => {
    const lang = newLang as Language;
    setLanguage(lang);
    setCode(starterCode[lang]);
  };
  
  const handleReset = () => {
    setCode(starterCode[language]);
    setOutput('');
  };
  
  const handleRun = () => {
    // Basic client-side execution for JavaScript only
    if (language === 'javascript') {
      try {
        // Create a safe execution context
        const func = new Function('return ' + code)();
        const result = func([1, 2, 3]); // Example input
        setOutput(`Output: ${JSON.stringify(result)}`);
      } catch (error: any) {
        setOutput(`Error: ${error.message || 'Unknown error'}`);
      }
    } else {
      setOutput(`Code execution for ${language} requires server-side processing`);
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Reset
          </button>
          <button
            onClick={handleRun}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center gap-1"
          >
            <Play size={14} />
            Run
          </button>
          <button
            onClick={() => onSubmit(code, language)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-1"
          >
            <Save size={14} />
            Submit
          </button>
        </div>
      </div>
      
      {/* Code Editor */}
      <div className="flex-1 flex flex-col">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 p-4 bg-gray-800 text-white font-mono text-sm resize-none focus:outline-none"
          spellCheck={false}
          style={{
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            tabSize: 2,
          }}
        />
        
        {/* Output Console */}
        {output && (
          <div className="h-32 border-t border-gray-700 p-3 bg-gray-900">
            <div className="text-xs text-gray-400 mb-1">Output:</div>
            <pre className="text-sm text-white font-mono overflow-auto">{output}</pre>
          </div>
        )}
      </div>
    </div>
  );
}