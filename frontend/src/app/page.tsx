// frontend/src/app/interview/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Code, Loader, Circle, ArrowRight } from 'lucide-react';
import CodeEditor from '@/components/CodeEditor';
import MessageList from '@/components/MessageList';
import { useWebSocket } from '@/lib/websocket';
import axios from 'axios';

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  codeBlock?: {
    language: string;
    code: string;
  };
}

export default function InterviewPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [interviewType, setInterviewType] = useState('frontend');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { sendMessage, lastMessage, connectionStatus } = useWebSocket(
    sessionId ? `${WORKER_URL.replace('http', 'ws')}/api/ws?sessionId=${sessionId}` : null
  );
  
  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        if (data.type === 'response') {
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.data.response,
            timestamp: new Date().toISOString()
          }]);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    }
  }, [lastMessage]);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const initializeSession = async () => {
    setIsInitializing(true);
    try {
      const response = await axios.post(`${WORKER_URL}/api/session/create`, {
        userId: localStorage.getItem('userId') || 'user_' + Math.random().toString(36),
        interviewType
      });
      
      setSessionId(response.data.sessionId);
      
      // Add welcome message
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Welcome to your ${interviewType} technical interview! I'm your AI interviewer today. Let's start with a brief introduction. Could you tell me about your background and what interests you about this role?`,
        timestamp: new Date().toISOString()
      }]);
      
      // Load initial question
      loadQuestion();
      setHasStarted(true);
    } catch (error) {
      console.error('Failed to initialize session:', error);
    } finally {
      setIsInitializing(false);
    }
  };
  
  const loadQuestion = async () => {
    try {
      const response = await axios.get(`${WORKER_URL}/api/questions/${interviewType}`);
      if (response.data.questions.length > 0) {
        setCurrentQuestion(response.data.questions[0]);
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return;
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${WORKER_URL}/api/interview/message`, {
        sessionId,
        message: inputMessage,
        userId: localStorage.getItem('userId')
      });
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCodeSubmit = async (code: string, language: string) => {
    if (!sessionId) return;
    
    setIsLoading(true);
    
    try {
      sendMessage(JSON.stringify({
        type: 'code',
        code,
        language
      }));
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'user',
        content: `I've submitted my ${language} solution:`,
        timestamp: new Date().toISOString(),
        codeBlock: { language, code }
      }]);
    } catch (error) {
      console.error('Failed to submit code:', error);
    }
  };

  const interviewTracks = [
    {
      id: 'frontend',
      title: 'Frontend Engineering',
      description: 'React, Vue, Angular, CSS, Performance',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'backend',
      title: 'Backend Engineering',
      description: 'APIs, Databases, Architecture, Security',
      color: 'bg-green-50 border-green-200'
    },
    {
      id: 'fullstack',
      title: 'Full Stack',
      description: 'End-to-end development, DevOps',
      color: 'bg-purple-50 border-purple-200'
    },
    {
      id: 'system-design',
      title: 'System Design',
      description: 'Scalability, Architecture, Trade-offs',
      color: 'bg-orange-50 border-orange-200'
    },
    {
      id: 'algorithms',
      title: 'Algorithms & DS',
      description: 'Data Structures, Problem Solving',
      color: 'bg-cyan-50 border-cyan-200'
    }
  ];
  
  // Pre-interview track selection screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-5xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Welcome to Virtview
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Select your interview track to begin your AI-powered technical interview
            </p>
          </div>

          {/* Interview Track Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {interviewTracks.map((track) => (
              <button
                key={track.id}
                onClick={() => setInterviewType(track.id)}
                className={`p-6 rounded-xl border-2 transition-all text-left hover:shadow-lg cursor-pointer ${
                  interviewType === track.id
                    ? `${track.color} border-current shadow-md`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {track.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {track.description}
                </p>
              </button>
            ))}
          </div>

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={initializeSession}
              disabled={isInitializing}
              className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInitializing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Initializing Interview...
                </>
              ) : (
                <>
                  Start Interview
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Selected: <span className="font-medium text-gray-700">
                {interviewTracks.find(t => t.id === interviewType)?.title}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Main interview interface
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Virtview</h1>
            <p className="text-xs text-gray-500">AI Interview Prep</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Interview Type Display */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Interview Track
            </label>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {interviewTracks.find(t => t.id === interviewType)?.title}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {interviewTracks.find(t => t.id === interviewType)?.description}
                </p>
              </div>
            </div>
          </div>
          
          {/* Session Info */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Session Status
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Connection</span>
                <div className="flex items-center gap-2">
                  <Circle className={`w-2 h-2 ${
                    connectionStatus === 'connected' 
                      ? 'fill-green-500 text-green-500' 
                      : 'fill-yellow-500 text-yellow-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-900 capitalize">{connectionStatus}</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Messages</span>
                <span className="text-sm font-semibold text-gray-900">{messages.length}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Code Editor Toggle */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer"
          >
            <Code size={18} />
            {showCodeEditor ? 'Hide' : 'Open'} Code Editor
          </button>
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto px-8 py-12">
            <MessageList messages={messages} />
            {isLoading && (
              <div className="flex gap-4 mt-8">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Loader className="w-5 h-5 animate-spin text-blue-600" />
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 flex items-center gap-3">
                  <span className="text-sm text-gray-900">AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white shadow-lg">
          <div className="max-w-4xl mx-auto px-8 py-6">
            <div className="flex gap-3 items-end">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your response..."
                className="flex-1 px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm transition-all"
                disabled={!sessionId || isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!sessionId || isLoading || !inputMessage.trim()}
                className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-2 text-sm font-semibold"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Code Editor Panel */}
      {showCodeEditor && (
        <div className="w-1/2 border-l border-gray-200 bg-white flex flex-col">
          <div className="p-6 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                  Code Editor - In Development
                </h3>
                <p className="text-xs text-yellow-700">
                  The code editor section is still in progress and will be working soon. Check back later for full functionality.
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <CodeEditor onSubmit={handleCodeSubmit} />
          </div>
        </div>
      )}
    </div>
  );
}