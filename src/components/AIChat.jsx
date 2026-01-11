import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FiCopy, FiThumbsUp, FiThumbsDown, FiCheck } from 'react-icons/fi';
import '../styles/AIChat.css';

const AIChat = ({ isOpen }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [feedback, setFeedback] = useState({});
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);
  const genAI = useRef(null);

  // Initialize Gemini
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (apiKey) {
      genAI.current = new GoogleGenerativeAI(apiKey);
    }
  }, []);

  // Load history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    const savedFeedback = localStorage.getItem('chatFeedback');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      setMessages([
        { id: 'welcome', role: 'model', content: "Salom! Men Examify AI yordamchisiman 😊. Iltimos, maktabimiz yoki platforma haqida biror savol yozing..." }
      ]);
    }
    if (savedFeedback) setFeedback(JSON.parse(savedFeedback));
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('chatFeedback', JSON.stringify(feedback));
  }, [feedback]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    const userMsgId = Date.now();
    const userMessage = { id: userMsgId, role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    const aiMsgId = Date.now() + 1;
    setMessages(prev => [...prev, { id: aiMsgId, role: 'model', content: "O'ylamoqda..." }]);

    try {
      if (!genAI.current) throw new Error("API Key topilmadi");

      // Use the model suggested by user snippet or a current 2026 model
      const model = genAI.current.getGenerativeModel({ 
        model: "gemini-2.5-flash", 
        systemInstruction: "Siz Sergeli tumanidagi ixtisoslashtirilgan maktabimiz bo'yicha yordam beradigan Examify AI yordamchisisiz. Bizning maktabimizda 500 dan ortiq o'quvchi, 50 dan ortiq ustozlar, 20 dan ortiq sinflar mavjud. Manzilimiz: Sergeli tumani, Nilufar MFY, Sergeli 2-mavzesi, 64A-uy. Maktabda Mock testlar, Zakovatlar va turli olimpiadalar o'tadi. Ali - sport vaziri maktabimizda. Maktabda eng zo'r ustoz Maftuna Saidova (matematika fani oqituvchisi). Ushbu saytni Jahongir To'xtayev va Jabborov Adham yaratgan (Frontend va UI/UX). Javoblaringiz qisqa, aniq, do'stona bo'lsin va o'zbek tilida muloqot qiling."
      });

      // Prepare chat history
      const history = messages
        .filter(m => m.id !== 'welcome' && m.id !== userMsgId && m.id !== aiMsgId)
        .map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

      const chat = model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      const result = await chat.sendMessage(currentInput);
      const response = await result.response;
      let botText = response.text();

      // Typing simulation
      let index = 0;
      setMessages(prev => {
        const newMsgs = [...prev];
        const lastIdx = newMsgs.findIndex(m => m.id === aiMsgId);
        if (lastIdx !== -1) newMsgs[lastIdx].content = "";
        return newMsgs;
      });

      intervalRef.current = setInterval(() => {
        index++;
        setMessages(prev => {
          const newMsgs = [...prev];
          const lastIdx = newMsgs.findIndex(m => m.id === aiMsgId);
          if (lastIdx !== -1) newMsgs[lastIdx].content = botText.slice(0, index);
          return newMsgs;
        });

        if (index === botText.length) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsLoading(false);
        }
      }, 15);

    } catch (error) {
      console.error('AI Error:', error);
      // If 1.5-flash is retired, try 1.5-flash-8b or 2.0-flash (in 2026 this is likely needed)
      let errorMsg = error.message || "Xatolik yuz berdi";
      setMessages(prev => {
        const newMsgs = [...prev];
        const lastIdx = newMsgs.findIndex(m => m.id === aiMsgId);
        if (lastIdx !== -1) newMsgs[lastIdx].content = `Xatolik: ${errorMsg}. Iltimos qaytadan urinib ko'ring.`;
        return newMsgs;
      });
      setIsLoading(false);
    }
  };

  const copyMessage = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const rateMessage = (messageId, isPositive) => {
    setFeedback(prev => ({ ...prev, [messageId]: isPositive ? 'like' : 'dislike' }));
  };

  const clearChat = () => {
    localStorage.removeItem('chatMessages');
    setMessages([{ id: 'welcome', role: 'model', content: "Chat tozalandi. Qanday yordam bera olaman?" }]);
  };

  if (!isOpen) return null;

  return (
    <div className="ai-chat-header-section">
      <div className="ai-chat-container">
        <div className="ai-messages-list">
          {messages.map((msg, idx) => (
            <div key={msg.id} className={`ai-message ${msg.role === 'model' ? 'assistant' : 'user'} ${msg.content === "O'ylamoqda..." ? 'thinking' : ''}`}>
              <div className="message-text">
                {msg.content === "O'ylamoqda..." ? (
                  <div className="thinking-glow-container">
                    <div className="thinking-orb"></div>
                    <span className="thinking-text">O'ylamoqda...</span>
                  </div>
                ) : msg.content}
              </div>
              
              {msg.role === 'model' && msg.id !== 'welcome' && !isLoading && (
                <div className="ai-msg-actions">
                  <button onClick={() => copyMessage(msg.content, idx)} title="Nusxa ol">
                    {copiedIndex === idx ? <FiCheck size={14} color="#4cd964" /> : <FiCopy size={14} />}
                  </button>
                  <button 
                    onClick={() => rateMessage(msg.id, true)} 
                    className={feedback[msg.id] === 'like' ? 'active' : ''}
                  >
                    <FiThumbsUp size={14} />
                  </button>
                  <button 
                    onClick={() => rateMessage(msg.id, false)}
                    className={feedback[msg.id] === 'dislike' ? 'active' : ''}
                  >
                    <FiThumbsDown size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-chat-footer">
          <button className="clear-chat-btn" onClick={clearChat} title="Chatni tozalash">
             <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete_sweep</span>
          </button>
          <form className="ai-input-wrapper" onSubmit={handleSend}>
            <input 
              type="text" 
              className="ai-input-area" 
              placeholder="Savolingizni yozing..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className="ai-send-btn" disabled={!input.trim() || isLoading}>
              <span className="material-symbols-outlined">arrow_upward</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
