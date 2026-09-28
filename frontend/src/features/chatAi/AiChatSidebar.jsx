import React, { useEffect, useState, useRef } from 'react';
import { X, Send, Bot, Sparkles, Plus, Download, History, MessageSquare, PencilLine, Check, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';
import { IconButtonModal } from '../../components/shared/IconButtonModal';

export const AiChatSidebar = ({ theme = 'dark' }) => {
  const { isAiSidebarOpen, toggleAiSidebar, closeAiSidebar } = useUiStore();
  const [activeTab, setActiveTab] = useState('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [newConversationActive, setNewConversationActive] = useState(false);
  const [currentConversationLabel, setCurrentConversationLabel] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [days, setDays] = useState([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [expandedDays, setExpandedDays] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [downloadingUrls, setDownloadingUrls] = useState({});
  const listRef = useRef(null);
  const inputRef = useRef(null);

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
  }, [isAiSidebarOpen]);

  useEffect(() => {
    if (activeTab === 'chat' && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  function groupByDay(conversations) {
    const grouped = conversations.reduce((acc, conversation) => {
      const day = conversation.day || conversation.started_at?.slice(0, 10) || 'Sem data';
      if (!acc[day]) acc[day] = [];
      acc[day].push(conversation);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([day, items]) => ({
        day,
        conversations: items.sort((a, b) => (Number(a.day_index || 1) - Number(b.day_index || 1))),
      }))
      .sort((a, b) => b.day.localeCompare(a.day));
  }

  async function fetchDays() {
    try {
      const res = await fetch('/api/chat/conversations');
      if (!res.ok) return;
      const json = await res.json();
      setDays(groupByDay(json.data || []));
    } catch (err) {
      setDays([]);
    }
  }

  async function fetchConversationDetails(conversation) {
    const conversationId = conversation.id ?? conversation.conversation_id;
    if (!conversationId) return;

    try {
      const res = await fetch(`/api/chat/conversation/${conversationId}`);
      if (!res.ok) return;
      const json = await res.json();
      const data = json.data || {};

      setSelectedConversationId(conversationId);
      setSelectedDay(data.day || conversation.day || conversation.started_at?.slice(0, 10));
      setCurrentConversationLabel(data.title || conversation.title || 'Conversa');
      setNewConversationActive(false);
      setMessages(data.messages || []);
      setIsEditingTitle(false);
      setDraftTitle('');
      setActiveTab('chat');
    } catch (err) {
      // ignore
    }
  }

  async function handleSend() {
    const text = input?.trim();
    if (!text) return;

    const activeConversationId = selectedConversationId || undefined;
    setInput('');
    setIsLoading(true);

    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((m) => [...m, userMessage]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          conversation_id: activeConversationId,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Erro ao enviar mensagem');
      }

      const json = await res.json();
      const data = json.data || {};
      const conversationId = data.conversation_id || activeConversationId;

      const assistantMessage = {
        role: 'assistant',
        content: data.content || '',
        timestamp: data.timestamp || new Date().toISOString(),
      };

      setMessages((m) => [...m, assistantMessage]);

      if (conversationId) {
        setSelectedConversationId(conversationId);
        setCurrentConversationLabel(data.conversation_title || currentConversationLabel || text);
        setSelectedDay(data.started_at ? data.started_at.slice(0, 10) : selectedDay || new Date().toISOString().slice(0, 10));
      }

      await fetchDays();
    } catch (err) {
      const errorMsg = { role: 'assistant', content: `Erro: ${err.message}`, timestamp: new Date().toISOString() };
      setMessages((m) => [...m, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleNewChat() {
    setSelectedConversationId(null);
    setSelectedDay(new Date().toISOString().slice(0, 10));
    setCurrentConversationLabel('Nova conversa');
    setNewConversationActive(true);
    setMessages([]);
    setIsEditingTitle(false);
    setDraftTitle('');
    setActiveTab('chat');
  }

  async function handleEditTitle() {
    if (!selectedConversationId) return;
    const nextTitle = draftTitle.trim();
    if (!nextTitle) return;

    try {
      const res = await fetch('/api/chat/conversation/title', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversationId,
          title: nextTitle,
        }),
      });

      if (!res.ok) throw new Error('Não foi possível atualizar o título');

      const json = await res.json();
      const updated = json.data || {};
      setCurrentConversationLabel(updated.title || nextTitle);
      setIsEditingTitle(false);
      setDraftTitle('');
      await fetchDays();
    } catch (err) {
      // ignore
    }
  }

  function handleTitleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditTitle();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setDraftTitle('');
    }
  }

  function toggleDay(day) {
    setExpandedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  }

  function handleDeleteConversation(e, conversationId) {
    e.stopPropagation();
    setDeleteConfirmation({ conversationId });
  }

  async function confirmDelete() {
    if (!deleteConfirmation) return;

    try {
      const res = await fetch(`/api/chat/conversation/${deleteConfirmation.conversationId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Não foi possível deletar a conversa');

      if (selectedConversationId === deleteConfirmation.conversationId) {
        setSelectedConversationId(null);
        setMessages([]);
        setCurrentConversationLabel('');
      }

      setDeleteConfirmation(null);
      await fetchDays();
    } catch (err) {
      alert(`Erro ao deletar: ${err.message}`);
      setDeleteConfirmation(null);
    }
  }

  function cancelDelete() {
    setDeleteConfirmation(null);
  }

  // Baixa o arquivo via fetch (blob) em vez de abrir em nova aba.
  // Evita o "flicker" de abrir/fechar aba enquanto o backend gera o arquivo
  // (perceptível principalmente no PDF, que demora mais que o Excel).
  function guessFileName(url, fallback) {
    try {
      const { pathname } = new URL(url);
      const last = pathname.split('/').filter(Boolean).pop();
      if (last && last.includes('.')) return last;
    } catch (err) {
      // ignore
    }
    return fallback;
  }

  // Detecta o tipo de arquivo pela URL (extensão ou palavras-chave no path)
  // e monta sempre o rótulo "Baixar {tipo}", ignorando o texto que a IA
  // escreveu no link markdown.
  function getDownloadLabel(url) {
    const lower = (url || '').toLowerCase();

    if (lower.includes('.pdf') || lower.includes('pdf')) return 'Baixar PDF';
    if (lower.includes('.xlsx') || lower.includes('.xls') || lower.includes('excel')) return 'Baixar Excel';
    if (lower.includes('.csv') || lower.includes('csv')) return 'Baixar CSV';
    if (lower.includes('.doc') || lower.includes('word')) return 'Baixar Word';
    if (lower.includes('.zip') || lower.includes('zip')) return 'Baixar ZIP';

    return 'Baixar arquivo';
  }

  async function handleDownload(url, label) {
    if (downloadingUrls[url]) return;

    setDownloadingUrls((prev) => ({ ...prev, [url]: true }));

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Não foi possível baixar o arquivo');

      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = guessFileName(url, label || 'relatorio');
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      alert(`Erro ao baixar arquivo: ${err.message}`);
    } finally {
      setDownloadingUrls((prev) => {
        const next = { ...prev };
        delete next[url];
        return next;
      });
    }
  }

  // Detecta links markdown [texto](url) dentro do conteúdo da mensagem e
  // os transforma em botões de download, mantendo o texto ao redor intacto.
  // Ex: "Aqui está o link ... [Download do Relatório Excel](http://...)"
  // vira: texto normal + botão "Download do Relatório Excel".
  // Interpreta marcações simples de markdown dentro de um trecho de texto:
  // **negrito** vira <strong>, sem deixar os asteriscos visíveis.
  function parseInlineMarkdown(text, keyPrefix) {
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const nodes = [];
    let lastIndex = 0;
    let match;
    let i = 0;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(text.slice(lastIndex, match.index));
      }
      nodes.push(<strong key={`${keyPrefix}-b-${i++}`}>{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex));
    }

    return nodes.length > 0 ? nodes : text;
  }

  function renderMessageContent(content) {
    if (!content) return null;

    // Aceita variações que a IA às vezes retorna:
    // - formato padrão markdown [texto](http://...)
    // - espaço entre ] e ( → [texto] (http://...)
    // - prefixo dentro dos parênteses → [texto](_url_: http://...)
    const linkRegex = /\[([^\]]+)\]\s*\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = linkRegex.exec(content)) !== null) {
      const [fullMatch, linkText, rawInside] = match;
      const urlMatch = rawInside.match(/https?:\/\/[^\s)]+/);

      if (!urlMatch) {
        // Não achou uma URL válida ali dentro, então trata como texto normal
        // e não interrompe o parsing.
        continue;
      }

      const linkUrl = urlMatch[0];

      if (match.index > lastIndex) {
        const textChunk = content.slice(lastIndex, match.index);
        if (textChunk) {
          parts.push(
            <span key={`text-${key}`} className="whitespace-pre-wrap">
              {parseInlineMarkdown(textChunk, `text-${key}`)}
            </span>
          );
          key++;
        }
      }

      parts.push(
        <IconButtonModal
          key={`link-${key++}`}
          icon={Download}
          label={downloadingUrls[linkUrl] ? 'Baixando...' : getDownloadLabel(linkUrl)}
          disabled={!!downloadingUrls[linkUrl]}
          onClick={() => handleDownload(linkUrl, linkText)}
          variant="full"
          colorVariant="default"
          className="!py-1.5 !px-3 !text-[10px] !mt-1.5 !mb-1 self-start disabled:opacity-60"
        />
      );

      lastIndex = match.index + fullMatch.length;
    }

    if (lastIndex < content.length) {
      const textChunk = content.slice(lastIndex);
      if (textChunk) {
        parts.push(
          <span key={`text-${key}`} className="whitespace-pre-wrap">
            {parseInlineMarkdown(textChunk, `text-${key}`)}
          </span>
        );
        key++;
      }
    }

    return parts.length > 0 ? parts : <span className="whitespace-pre-wrap">{parseInlineMarkdown(content, 'text-0')}</span>;
  }

  function renderMessage(msg, idx) {
    const isUser = msg.role === 'user';
    return (
      <div key={`${msg.role}-${idx}-${msg.timestamp || idx}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
            isUser
              ? 'bg-[var(--p-chat-bg-user)] text-slate-950 font-medium rounded-tr-none border border-[var(--p-border)]'
              : 'panel-subcard bg-[var(--p-chat-bg-ia)] border border-[var(--p-border)] text-[var(--p-text)] rounded-tl-none'
          }`}
        >
          <div className="flex flex-col gap-1">{renderMessageContent(msg.content)}</div>
          {msg.metadata?.attachments && msg.metadata.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {msg.metadata.attachments.map((att, i) => (
                <IconButtonModal
                  key={i}
                  icon={Download}
                  label={downloadingUrls[att.url] ? 'Baixando...' : getDownloadLabel(att.url)}
                  disabled={!!downloadingUrls[att.url]}
                  onClick={() => handleDownload(att.url, 'relatorio')}
                  variant="full"
                  colorVariant="default"
                  className="!py-1 !px-2.5 !text-[10px] disabled:opacity-60"
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
      <div
        onClick={closeAiSidebar}
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ease-in-out ${
          isAiSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        className={`panel-theme-${theme} fixed top-0 right-0 h-screen w-full sm:w-[420px] z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform ${
          isAiSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="panel-base h-full rounded-none border-y-0 border-r-0 border-l bg-[var(--p-bg)] text-[var(--p-text)] flex flex-col">
          <div className="panel-header-base bg-[var(--p-header-bg)] border-b border-[var(--p-border)] flex items-center justify-between p-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[var(--p-bg)] border border-[var(--p-border)] flex items-center justify-center">
                <Bot size={18} className="text-[var(--p-toggle-accent,#34d399)]" />
              </div>
              <div>
                <h3 className="text-sm font-theme-title text-theme-title flex items-center gap-1.5">
                  Sentinel Chat
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

          <div className="flex-1 overflow-hidden flex flex-col bg-[var(--p-bg)]">
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between gap-2 p-4 pb-2.5 border-b border-[var(--p-border)] shrink-0">
                  <div className="min-w-0 flex-1">
                    {isEditingTitle && selectedConversationId ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={draftTitle}
                          onChange={(e) => setDraftTitle(e.target.value)}
                          onKeyDown={handleTitleKeyDown}
                          className="w-full rounded-lg border border-[var(--p-border)] bg-[var(--p-bg)] px-2 py-1.5 text-[11px] text-[var(--p-text)] outline-none focus:border-[var(--p-toggle-accent)] transition-colors"
                          placeholder="Editar título (Enter para salvar)"
                        />
                        <button
                          type="button"
                          onClick={handleEditTitle}
                          className="p-1.5 rounded-lg bg-[var(--p-toggle-accent)] text-slate-900"
                          aria-label="Salvar título"
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[var(--p-toggle-accent)] truncate">
                          {currentConversationLabel || 'Nova conversa'}
                        </span>
                        {selectedConversationId && !newConversationActive && (
                          <button
                            type="button"
                            onClick={() => {
                              setDraftTitle(currentConversationLabel || '');
                              setIsEditingTitle(true);
                            }}
                            className="p-1 rounded-md border border-[var(--p-border)] hover:bg-[var(--p-header-bg)]"
                            aria-label="Editar título"
                          >
                            <PencilLine size={11} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedConversationId && !newConversationActive && (
                    <span className="text-[9px] uppercase tracking-[0.12em] text-theme-muted">
                      #{selectedDay ? selectedDay : 'Hoje'}
                    </span>
                  )}
                </div>

                <div ref={listRef} className="flex-1 p-4 pt-3 overflow-y-auto space-y-3 custom-scrollbar">
                  {messages.length === 0 && !newConversationActive && (
                    <div className="text-xs text-theme-muted text-center mt-10 p-4">
                      Nenhuma mensagem selecionada. Digite uma dúvida abaixo ou selecione uma conversa no Histórico.
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    {messages.map((m, idx) => renderMessage(m, idx))}
                  </div>
                </div>
              </div>
            )}

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

                <div className="flex flex-col gap-3">
                  {days.map((dayGroup) => (
                    <div key={dayGroup.day} className="rounded-xl border border-[var(--p-border)] bg-[var(--p-bg)]">
                      <button
                        type="button"
                        onClick={() => toggleDay(dayGroup.day)}
                        className="w-full p-2.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-theme-muted hover:text-[var(--p-text)] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {expandedDays[dayGroup.day] ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                          <span>{dayGroup.day}</span>
                        </div>
                        <span>{dayGroup.conversations.length} conversa(s)</span>
                      </button>

                      {expandedDays[dayGroup.day] && (
                        <div className="px-2.5 pb-2.5 pt-2.5 flex flex-col gap-2 border-t border-[var(--p-border)]">
                          {dayGroup.conversations.map((conversation) => {
                            const conversationId = conversation.id ?? conversation.conversation_id;
                            const active = selectedConversationId === conversationId && !newConversationActive;

                            return (
                              <button
                                key={conversationId}
                                type="button"
                                onClick={() => fetchConversationDetails(conversation)}
                                className={`w-full text-left rounded-xl border p-2.5 transition-all group ${
                                  active
                                    ? 'bg-[var(--p-header-bg)] border-[var(--p-toggle-accent)] text-[var(--p-text)] shadow-sm'
                                    : 'border-[var(--p-border)] bg-[var(--p-bg)] hover:bg-[var(--p-header-bg)] text-theme-muted hover:text-[var(--p-text)]'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-[11px] font-semibold">{conversation.title || 'Conversa sem título'}</div>
                                    <div className="mt-1 text-[9px] opacity-75">
                                      Início: {conversation.started_at ? new Date(conversation.started_at).toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      }) : 'Sem data'}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-semibold uppercase text-[var(--p-toggle-accent)]">
                                      #{conversation.day_index || 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteConversation(e, conversationId)}
                                      className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                                      title="Deletar conversa"
                                    >
                                      <Trash2 size={12} className="text-red-500" />
                                    </button>
                                  </div>
                                </div>
                                <div className="mt-2 text-[9px] opacity-75">
                                  {conversation.count ?? conversation.messages?.length ?? 0} mensagens
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {activeTab === 'chat' && (
            <div className="p-3 border-t border-[var(--p-border)] bg-[var(--p-header-bg)]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isLoading) handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  disabled={isLoading}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  type="text"
                  placeholder={isLoading ? 'Aguarde a resposta...' : 'Digite sua dúvida...'}
                  className="flex-1 text-xs bg-[var(--p-bg)] border border-[var(--p-border)] text-[var(--p-text)] placeholder:text-theme-muted rounded-xl px-3 py-2.5 outline-none focus:border-[var(--p-toggle-accent)] transition-colors disabled:opacity-50"
                />
                <IconButtonModal
                  tipo="submit"
                  disabled={isLoading}
                  icon={Send}
                  variant="ghost"
                  colorVariant="default"
                  title={isLoading ? 'Aguardando resposta...' : 'Enviar mensagem'}
                  className="!p-2.5 !rounded-xl disabled:opacity-50"
                />
              </form>
            </div>
          )}
        </div>
      </aside>

      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--p-bg)] border border-[var(--p-border)] rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--p-text)]">
              Deletar conversa?
            </h3>
            <p className="text-xs text-theme-muted">
              Tem certeza que deseja deletar esta conversa? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={cancelDelete}
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--p-border)] text-xs font-medium text-[var(--p-text)] hover:bg-[var(--p-header-bg)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 px-3 py-2 rounded-lg bg-red-500 text-xs font-medium text-white hover:bg-red-600 transition-colors"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiChatSidebar;