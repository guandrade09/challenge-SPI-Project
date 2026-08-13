import React, { useEffect, useState, useRef } from 'react';
import { X, Send, Bot } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';

export const AiChatSidebar = () => {
  const { isAiSidebarOpen, closeAiSidebar } = useUiStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [newConversationCount, setNewConversationCount] = useState(0);
  const [newConversationActive, setNewConversationActive] = useState(false);
  const [currentConversationLabel, setCurrentConversationLabel] = useState('');
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isAiSidebarOpen) {
        closeAiSidebar();
      }
    };
    if (isAiSidebarOpen) {
      window.addEventListener('keydown', handleKeyDown);
      fetchDays();
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAiSidebarOpen, closeAiSidebar]);

  useEffect(() => {
    // scroll to bottom when messages update
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  async function fetchDays() {
    try {
      const res = await fetch('/api/chat/history/daily');
      if (!res.ok) return;
      const json = await res.json();
      setDays(json.data || []);
    } catch (err) {
      // ignore
    }
  }

  async function fetchMessagesForDay(day) {
    try {
      const res = await fetch(`/api/chat/history/day/${day}`);
      if (!res.ok) return;
      const json = await res.json();
      setSelectedDay(day);
      setMessages(json.data || []);
    } catch (err) {
      // ignore
    }
  }

  async function handleSend() {
    const text = input?.trim();
    if (!text) return;

    // add user message locally
    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Erro ao enviar mensagem');
      }
      const json = await res.json();
      const data = json.data;

      // assistant response may include metadata
      const assistantMsg = { role: 'assistant', content: data.content || data, metadata: data.metadata ? (typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata) : null, timestamp: new Date().toISOString() };
      setMessages((m) => [...m, assistantMsg]);

      // refresh days list (new message may create today's day)
      fetchDays();
    } catch (err) {
      const errorMsg = { role: 'assistant', content: `Erro: ${err.message}`, timestamp: new Date().toISOString() };
      setMessages((m) => [...m, errorMsg]);
    }
  }

  function renderMessage(msg, idx) {
    const isUser = msg.role === 'user';
    return (
      <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`${isUser ? 'bg-[var(--color-panel-header)] text-white self-end' : 'bg-white text-zinc-800'} p-4 rounded-2xl rounded-tl-none shadow-sm text-sm max-w-[85%]`}> 
          <div className="whitespace-pre-wrap">{msg.content}</div>
          {msg.metadata?.attachments && msg.metadata.attachments.length > 0 && (
            <div className="mt-2 flex gap-2">
              {msg.metadata.attachments.map((att, i) => (
                <button key={i} onClick={() => window.open(att.url, '_blank')} className="px-3 py-1 bg-[var(--color-panel-header)] text-white rounded-md text-xs">
                  Baixar relatório
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {isAiSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={closeAiSidebar}
        />
      )}

      <aside className={`fixed right-0 top-0 h-full w-96 bg-[var(--color-panel-bg)] shadow-2xl z-50 transform transition-transform duration-500 ease-in-out flex flex-col ${isAiSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        <div className="bg-[var(--color-panel-header)] p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 text-zinc-800">
            <Bot size={24} />
            <h3 className="font-bold uppercase tracking-tighter">Diálogo com IA</h3>
          </div>
          <button
            onClick={closeAiSidebar}
            className="p-2 hover:bg-black/10 rounded-full transition-colors text-zinc-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
          <div className="flex gap-4">
            <div className="w-1/3 border-r pr-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold">Histórico por dia</h4>
                <button onClick={() => {
                  // start a new (local) conversation outside the day filter
                  const today = new Date().toISOString().substr(0,10);
                  const next = newConversationCount + 1;
                  setNewConversationCount(next);
                  setNewConversationActive(true);
                  setCurrentConversationLabel(`Conversa ${next}`);
                  setSelectedDay(today);
                  setMessages([]);
                }} className="text-xs px-3 py-1 bg-[var(--color-panel-header)] text-white rounded-md">Novo chat</button>
              </div>
              <div className="flex flex-col gap-2">
                {days.length === 0 && <div className="text-xs text-zinc-500">Nenhum histórico</div>}
                {days.map((d) => (
                  <button key={d.day} onClick={() => fetchMessagesForDay(d.day)} className={`text-left text-sm p-2 rounded ${selectedDay === d.day ? 'bg-[var(--color-panel-header)] text-white' : 'hover:bg-zinc-100'}`}>
                    <div className="font-medium">{d.day}</div>
                    <div className="text-xs text-zinc-500">{d.count} mensagens</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="w-2/3 pl-2 flex flex-col h-full">
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar p-2">
                {newConversationActive && (
                  <div className="text-xs text-[var(--color-panel-header)] font-medium mb-2">{currentConversationLabel} (nova)</div>
                )}
                {messages.length === 0 && !newConversationActive && (
                  <div className="text-xs text-zinc-500">Nenhuma mensagem selecionada. Clique em um dia ou envie uma pergunta.</div>
                )}
                <div className="flex flex-col gap-4">
                  {messages.map((m, idx) => renderMessage(m, idx))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white/50 border-t border-zinc-200">
          <div className="relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              type="text"
              placeholder="Digite sua dúvida..."
              className="w-full p-4 pr-12 rounded-2xl border-none shadow-inner focus:ring-2 focus:ring-[var(--color-panel-header)] outline-none text-sm text-black"
            />
            <button onClick={handleSend} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[var(--color-panel-header)] hover:scale-110 transition-transform">
              <Send size={20} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AiChatSidebar;
