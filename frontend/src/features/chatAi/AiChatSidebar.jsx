import React, { useEffect, useState, useRef } from 'react';
import { X, Send, Bot, Sparkles, Plus, Download, History, MessageSquare } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';
import { IconButtonModal } from '../../components/shared/IconButtonModal';

export const AiChatSidebar = ({ theme = 'dark' }) => {
  const { isAiSidebarOpen, toggleAiSidebar, closeAiSidebar } = useUiStore();
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'history'
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
    if (activeTab === 'chat' && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

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
      setNewConversationActive(false);
      setMessages(json.data || []);
      setActiveTab('chat');
    } catch (err) {
      // ignore
    }
  }

  async function handleSend() {
    const text = input?.trim();
    if (!text) return;

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

      const assistantMsg = {
        role: 'assistant',
        content: data.content || data,
        metadata: data.metadata ? (typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata) : null,
        timestamp: new Date().toISOString()
      };
      setMessages((m) => [...m, assistantMsg]);

      fetchDays();
    } catch (err) {
      const errorMsg = { role: 'assistant', content: `Erro: ${err.message}`, timestamp: new Date().toISOString() };
      setMessages((m) => [...m, errorMsg]);
    }
  }

  function handleNewChat() {
    const today = new Date().toISOString().substr(0, 10);
    const next = newConversationCount + 1;
    setNewConversationCount(next);
    setNewConversationActive(true);
    setCurrentConversationLabel(`Conversa ${next}`);
    setSelectedDay(today);
    setMessages([]);
    setActiveTab('chat');
  }

  function renderMessage(msg, idx) {
    const isUser = msg.role === 'user';
    return (
      <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
            isUser
              ? 'bg-[var(--p-chat-bg-user)] text-slate-950 font-medium rounded-tr-none border border-[var(--p-border)]'
              : 'panel-subcard bg-[var(--p-chat-bg-ia)] border border-[var(--p-border)] text-[var(--p-text)] rounded-tl-none'
          }`}
        >
          <div className="whitespace-pre-wrap">{msg.content}</div>
          {msg.metadata?.attachments && msg.metadata.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {msg.metadata.attachments.map((att, i) => (
                <IconButtonModal
                  key={i}
                  icon={Download}
                  label="Baixar relatório"
                  onClick={() => window.open(att.url, '_blank')}
                  variant="full"
                  colorVariant="default"
                  className="!py-1 !px-2.5 !text-[10px]"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Overlay Backdrop - Usando fixed + z-50 para travar na tela inteira */}
      <div
        onClick={closeAiSidebar}
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ease-in-out ${
          isAiSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Painel Lateral - Usando fixed top-0 right-0 h-screen + z-50 */}
      <aside
        className={`panel-theme-${theme} fixed top-0 right-0 h-screen w-full sm:w-[420px] z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform ${
          isAiSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="panel-base h-full rounded-none border-y-0 border-r-0 border-l bg-[var(--p-bg)] text-[var(--p-text)] flex flex-col">
          
          {/* Cabeçalho do Painel */}
          <div className="panel-header-base bg-[var(--p-header-bg)] border-b border-[var(--p-border)] flex items-center justify-between p-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[var(--p-bg)] border border-[var(--p-border)] flex items-center justify-center">
                <Bot size={18} className="text-[var(--p-toggle-accent,#34d399)]" />
              </div>
              <div>
                <h3 className="text-sm font-theme-title text-theme-title flex items-center gap-1.5">
                  Diálogo com IA
                  <Sparkles size={13} className="text-amber-400" />
                </h3>
                <p className="text-[10px] text-theme-muted uppercase tracking-wider font-semibold">
                  Copiloto do Sistema
                </p>
              </div>
            </div>

            <IconButtonModal
              icon={X}
              onClick={toggleAiSidebar}
              variant="toggle"
              title="Fechar assistente"
              className="!p-2"
            />
          </div>

          {/* Sub-Header: Botões de navegação Conversa / Histórico */}
          <div className="flex items-center p-2.5 bg-[var(--p-header-bg)] border-b border-[var(--p-border)] gap-2">
            <IconButtonModal
              icon={MessageSquare}
              label="Conversa"
              onClick={() => setActiveTab('chat')}
              variant={activeTab === 'chat' ? 'full' : 'toggle'}
              colorVariant="default"
              className="flex-1 !py-1.5 !text-[11px]"
            />
            <IconButtonModal
              icon={History}
              label="Histórico"
              onClick={() => setActiveTab('history')}
              variant={activeTab === 'history' ? 'full' : 'toggle'}
              colorVariant="default"
              className="flex-1 !py-1.5 !text-[11px]"
            />
          </div>

          {/* Corpo do Painel */}
          <div className="flex-1 overflow-hidden flex flex-col bg-[var(--p-bg)]">
            
            {/* Seção 1: Chat de Conversação */}
            {activeTab === 'chat' && (
              <div ref={listRef} className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                {newConversationActive && (
                  <div className="text-[11px] text-[var(--p-toggle-accent)] font-semibold box-shadow pb-2 mb-2">
                    {currentConversationLabel} (nova)
                  </div>
                )}
                {messages.length === 0 && !newConversationActive && (
                  <div className="text-xs text-theme-muted text-center mt-10 p-4">
                    Nenhuma mensagem selecionada. Digite uma dúvida abaixo ou selecione um dia no Histórico.
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  {messages.map((m, idx) => renderMessage(m, idx))}
                </div>
              </div>
            )}

            {/* Seção 2: Histórico */}
            {activeTab === 'history' && (
              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                <div className="pb-3 border-b border-[var(--p-border)]">
                  <IconButtonModal
                    icon={Plus}
                    label="Nova Conversa"
                    onClick={handleNewChat}
                    variant="full"
                    colorVariant="default"
                    title="Iniciar nova conversa do zero"
                    className="w-full !py-2.5 !text-xs font-semibold"
                  />
                </div>

                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted">
                  Registros Anteriores
                </h4>

                {days.length === 0 && (
                  <div className="text-xs text-theme-muted italic p-3 text-center border border-dashed border-[var(--p-border)] rounded-xl">
                    Nenhum histórico encontrado
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {days.map((d) => (
                    <button
                      key={d.day}
                      onClick={() => fetchMessagesForDay(d.day)}
                      className={`text-left text-xs p-3 rounded-xl border transition-all flex items-center justify-between ${
                        selectedDay === d.day && !newConversationActive
                          ? 'bg-[var(--p-header-bg)] border-[var(--p-toggle-accent)] text-[var(--p-text)] shadow-sm'
                          : 'border-[var(--p-border)] bg-[var(--p-bg)] hover:bg-[var(--p-header-bg)] text-theme-muted hover:text-[var(--p-text)]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs">{d.day}</div>
                        <div className="text-[10px] opacity-75">{d.count} mensagens</div>
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-[var(--p-toggle-accent)]">
                        Abrir &rarr;
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Área de Input */}
          {activeTab === 'chat' && (
            <div className="p-3 border-t border-[var(--p-border)] bg-[var(--p-header-bg)]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  type="text"
                  placeholder="Digite sua dúvida..."
                  className="flex-1 text-xs bg-[var(--p-bg)] border border-[var(--p-border)] text-[var(--p-text)] placeholder:text-theme-muted rounded-xl px-3 py-2.5 outline-none focus:border-[var(--p-toggle-accent)] transition-colors"
                />
                <IconButtonModal
                  tipo="submit"
                  icon={Send}
                  variant="ghost"
                  colorVariant="default"
                  title="Enviar mensagem"
                  className="!p-2.5 !rounded-xl"
                />
              </form>
            </div>
          )}

        </div>
      </aside>
    </>
  );
};

export default AiChatSidebar;