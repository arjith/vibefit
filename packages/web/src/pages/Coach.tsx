import { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';

interface Message {
  role: 'user' | 'coach';
  content: string;
  timestamp: string;
}

export function Coach() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'coach',
      content: 'Hey! I\'m your VibeFit Coach. Ask me about training, nutrition, recovery, plateaus — anything fitness related!',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickQuestions = [
    'How do I break through a plateau?',
    'Am I overtraining?',
    'What should I eat?',
    'How am I doing?',
  ];

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text.trim(), timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/coach/ask', {
        question: text.trim(),
        history: messages.slice(-6),
      });

      const coachMsg: Message = {
        role: 'coach',
        content: data.data.content,
        timestamp: data.data.timestamp,
      };
      setMessages((prev) => [...prev, coachMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        role: 'coach',
        content: 'Sorry, I had trouble processing that. Try again in a moment.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="coach-page">
      <div className="coach-header">
        <h1>🤖 AI Coach</h1>
        <p className="coach-subtitle">Context-aware fitness advice powered by your training data</p>
      </div>

      <div className="coach-chat">
        <div className="coach-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`coach-message coach-message--${msg.role}`}>
              <div className="coach-message__avatar">
                {msg.role === 'coach' ? '🏋️' : '👤'}
              </div>
              <div className="coach-message__content">
                <p>{msg.content}</p>
                <span className="coach-message__time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="coach-message coach-message--coach">
              <div className="coach-message__avatar">🏋️</div>
              <div className="coach-message__content coach-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {messages.length <= 1 && (
          <div className="coach-quick-questions">
            {quickQuestions.map((q) => (
              <button key={q} className="coach-quick-btn" onClick={() => sendMessage(q)}>
                {q}
              </button>
            ))}
          </div>
        )}

        <form className="coach-input" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your coach anything..."
            disabled={loading}
            maxLength={1000}
          />
          <button type="submit" disabled={loading || !input.trim()} className="vf-btn vf-btn--primary">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
