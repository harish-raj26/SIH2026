import React, { useState, useRef, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { useNotification } from '../../context/NotificationContext';
import { aiService } from '../../services/aiService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Building2,
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'What documents are mandatory for Factory Licence approval?',
  'Explain the pollution category consent requirements for my industry.',
  'What are the mandatory fire safety clearance requirements for premises?',
  'What information is needed to complete building approval?',
  'Which clearance authority handles environmental pollution consent?',
];

export function AiAssistantPage() {
  const { activeBusiness } = useBusiness();
  const { showError } = useNotification();

  const [messages, setMessages] = useState([
    {
      id: 'msg_welcome',
      role: 'assistant',
      text: `Hello! I am BizClear AI, your regulatory compliance advisor. Ask me statutory questions regarding Factory Acts, Environmental Consents, Fire Safety norms, or application steps for ${activeBusiness?.name || 'your enterprise'}.`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend = null) => {
    const question = (textToSend || inputQuestion).trim();
    if (!question || loading) return;

    if (!activeBusiness?.id) {
      showError('Please register or select an enterprise first.');
      return;
    }

    const userMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: question,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuestion('');
    setLoading(true);

    try {
      const response = await aiService.askAI(activeBusiness.id, question);
      const aiMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        text: response.answer || 'No specific regulatory answer could be derived.',
        business: response.business,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        isError: true,
        text: `Error: ${err.message || 'Could not reach AI compliance model.'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'msg_welcome',
        role: 'assistant',
        text: `Chat session refreshed. How can I assist with compliance requirements for ${activeBusiness?.name || 'your enterprise'}?`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8E7] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#172126] tracking-tight">
              AI Compliance Assistant
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#E6F2F2] text-[#006B68]">
              Gemini 3.6 Flash + RAG
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#66757A]">
            Active Enterprise:{' '}
            <span className="font-semibold text-[#006B68]">
              {activeBusiness?.name || 'Select an enterprise'}
            </span>{' '}
            ({activeBusiness?.industry || 'General'})
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={Trash2}
          onClick={clearChat}
        >
          Clear Chat
        </Button>
      </div>

      {/* Suggested Questions */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-[#66757A] uppercase tracking-wider">
          Suggested Compliance Queries
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(q)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[#E2E8E7] bg-white text-[#172126] hover:bg-[#F0F7F6] hover:border-[#006B68] hover:text-[#004F4D] transition-colors cursor-pointer text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex flex-col h-[520px] shadow-xs">
        <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-[#006B68] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-xl p-3.5 text-xs leading-relaxed space-y-2 ${
                    isUser
                      ? 'bg-[#004F4D] text-white'
                      : msg.isError
                      ? 'bg-[#FCEEEE] text-[#C93D3D] border border-[#F8CDCD]'
                      : 'bg-[#F8FAF9] text-[#172126] border border-[#E2E8E7]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  <div className="flex items-center justify-between gap-4 pt-1 text-[10px] opacity-75">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {!isUser && !msg.isError && (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="hover:underline flex items-center gap-1 cursor-pointer text-[#006B68]"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-[#159A72]" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-[#004F4D] text-white flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-[#006B68] text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#E2E8E7] text-xs flex items-center gap-2 text-[#66757A]">
                <Sparkles className="w-4 h-4 text-[#006B68] animate-spin" />
                <span>Consulting statutory regulations & synthesizing response...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </CardContent>

        {/* Chat Input */}
        <div className="p-3 border-t border-[#E2E8E7] bg-white rounded-b-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Ask a statutory question regarding approvals, acts, or procedures..."
              disabled={loading}
              className="flex-1 px-3.5 py-2 rounded-lg border border-[#E2E8E7] text-xs sm:text-sm text-[#172126] placeholder-[#9AA5A8] focus:outline-none focus:border-[#006B68] focus:ring-2 focus:ring-[#006B68]/15"
            />
            <Button
              type="submit"
              variant="primary"
              icon={Send}
              loading={loading}
              disabled={!inputQuestion.trim() || loading}
            >
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
