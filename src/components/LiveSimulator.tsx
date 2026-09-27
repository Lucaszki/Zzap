import React, { useState } from 'react';
import { User, Contact, Ticket, Message, Deal, WebhookEventLog } from '../types/crm';
import {
  Send,
  Smartphone,
  MessageSquare,
  ArrowRightLeft,
  UserCheck,
  CheckCheck,
  Check,
  Tag,
  Shield,
  Bot,
  Zap,
  Lock,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import { META_APPROVED_TEMPLATES } from '../data/mockData';

interface LiveSimulatorProps {
  users: User[];
  contacts: Contact[];
  tickets: Ticket[];
  messages: Message[];
  deals: Deal[];
  eventLogs: WebhookEventLog[];
  onSendMessageFromClient: (contactId: string, text: string) => void;
  onSendMessageFromAgent: (ticketId: string, text: string, isInternalNote: boolean) => void;
  onTransferTicket: (ticketId: string, targetUserId: string, targetDept: any, note: string) => void;
  onSendHsmTemplate: (contactId: string, templateName: string) => void;
}

export const LiveSimulator: React.FC<LiveSimulatorProps> = ({
  users,
  contacts,
  tickets,
  messages,
  deals,
  eventLogs,
  onSendMessageFromClient,
  onSendMessageFromAgent,
  onTransferTicket,
  onSendHsmTemplate
}) => {
  // Current logged in agent in the CRM Inbox
  const [activeUserId, setActiveUserId] = useState<string>(users[1]?.id || users[0].id); // Carlos Silva
  // Selected ticket in CRM Inbox
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  // Selected contact in the Smartphone client simulator
  const [clientContactId, setClientContactId] = useState<string>(contacts[0]?.id || '');
  // Text inputs
  const [clientInputText, setClientInputText] = useState('');
  const [agentInputText, setAgentInputText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  // Transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetUserId, setTransferTargetUserId] = useState(users[2]?.id || '');
  const [transferNote, setTransferNote] = useState('');
  // Canned HSM templates modal
  const [showHsmPicker, setShowHsmPicker] = useState(false);
  // Filter tab for Inbox
  const [inboxFilter, setInboxFilter] = useState<'mine' | 'all' | 'queued'>('mine');

  const activeUser = users.find((u) => u.id === activeUserId) || users[0];
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];
  const ticketContact = contacts.find((c) => c.id === selectedTicket?.contactId);
  const ticketMessages = messages.filter((m) => m.ticketId === selectedTicket?.id);

  // Phone simulator contact
  const clientContact = contacts.find((c) => c.id === clientContactId) || contacts[0];
  const clientTicket = tickets.find((t) => t.contactId === clientContact.id);
  const clientMessages = messages.filter((m) => m.contactId === clientContact.id && !m.isInternalNote);

  // Filtered tickets in CRM
  const visibleTickets = tickets.filter((t) => {
    if (inboxFilter === 'mine') return t.assignedUserId === activeUserId;
    if (inboxFilter === 'queued') return !t.assignedUserId || t.status === 'QUEUED';
    return true;
  });

  const handleClientSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientInputText.trim()) return;
    onSendMessageFromClient(clientContact.id, clientInputText.trim());
    setClientInputText('');
  };

  const handleAgentSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentInputText.trim() || !selectedTicket) return;
    onSendMessageFromAgent(selectedTicket.id, agentInputText.trim(), isInternalNote);
    setAgentInputText('');
  };

  const handleExecuteTransfer = () => {
    if (!selectedTicket) return;
    const targetUser = users.find((u) => u.id === transferTargetUserId);
    onTransferTicket(
      selectedTicket.id,
      transferTargetUserId,
      targetUser?.department || 'GENERAL',
      transferNote
    );
    setShowTransferModal(false);
    setTransferNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header with quick role switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/40 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">Homologação em Tempo Real</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Ambiente Interativo de Validação</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Simulador de Webhooks, Chatbot de Triagem & Caixa Multiatendente
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Interaja pelo celular simulado (WhatsApp do Lead), observe o webhook oficial da Meta processar a mensagem, executar o bot de triagem, distribuir para a fila do atendente e transmitir as respostas em tempo real sem reload.
          </p>
        </div>

        {/* Atendente Logado Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800 self-start md:self-auto">
          <span className="text-[11px] text-slate-400 font-mono pl-2">Atendente Atual:</span>
          <select
            value={activeUserId}
            onChange={(e) => setActiveUserId(e.target.value)}
            className="px-2.5 py-1 text-xs font-medium bg-slate-900 text-emerald-400 rounded-lg border border-slate-700 focus:outline-none"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.department} · {u.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Execution Split View: Left (WhatsApp Phone) | Center (CRM Inbox) | Right (Live Event Bus) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================================= */}
        {/* 1. SMARTPHONE WHATSAPP SIMULATOR (4 Cols)                                 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden h-[740px]">
          {/* Phone Top Bar */}
          <div className="px-4 py-3 bg-emerald-800 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-700 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">
                OZ
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">OmniZap Empresa Oficial</h4>
                <span className="text-[10px] text-emerald-200 block">Conta Comercial Verificada ✓</span>
              </div>
            </div>

            {/* Quick Switch Client Number */}
            <select
              value={clientContactId}
              onChange={(e) => setClientContactId(e.target.value)}
              className="bg-emerald-900 text-white text-[11px] font-mono px-2 py-1 rounded border border-emerald-700 focus:outline-none"
              title="Trocar cliente simulado"
            >
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.split(' ')[0]} ({c.waId.slice(-4)})
                </option>
              ))}
            </select>
          </div>

          {/* Phone Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-slate-900/90 text-xs">
            <div className="text-center my-2">
              <span className="px-2.5 py-1 rounded bg-slate-800/80 text-[10px] text-slate-400 font-mono border border-slate-700">
                Criptografia de ponta a ponta · Meta Cloud API
              </span>
            </div>

            {clientMessages.map((msg) => {
              const isFromClient = msg.senderType === 'CONTACT';
              const isBot = msg.senderType === 'BOT';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isFromClient ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                      isFromClient
                        ? 'bg-emerald-600 text-white rounded-br-xs'
                        : isBot
                        ? 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700'
                        : 'bg-slate-800/95 text-slate-100 rounded-bl-xs border border-slate-700/80'
                    }`}
                  >
                    {!isFromClient && (
                      <div className="text-[10px] font-medium text-emerald-400 mb-1 flex items-center gap-1 font-mono">
                        {isBot ? <Bot className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        <span>{isBot ? 'OmniBot Triagem' : msg.senderName || 'Atendente OmniZap'}</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <div
                      className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                        isFromClient ? 'text-emerald-200' : 'text-slate-400'
                      }`}
                    >
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {isFromClient && (
                        <span>
                          {msg.status === 'READ' ? (
                            <CheckCheck className="w-3 h-3 text-sky-300" />
                          ) : msg.status === 'DELIVERED' ? (
                            <CheckCheck className="w-3 h-3 text-emerald-300" />
                          ) : (
                            <Check className="w-3 h-3 text-emerald-300" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick interactive bot options if bot menu was triggered */}
          <div className="p-2 bg-slate-950 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-[10px] text-slate-500 font-mono uppercase pl-1">Atalhos:</span>
            <button
              onClick={() => onSendMessageFromClient(clientContact.id, '1')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 whitespace-nowrap"
            >
              1 - Vendas
            </button>
            <button
              onClick={() => onSendMessageFromClient(clientContact.id, '2')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 whitespace-nowrap"
            >
              2 - Suporte
            </button>
            <button
              onClick={() => onSendMessageFromClient(clientContact.id, '3')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 whitespace-nowrap"
            >
              3 - Financeiro
            </button>
          </div>

          {/* Phone Send Input Form */}
          <form
            onSubmit={handleClientSend}
            className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={clientInputText}
              onChange={(e) => setClientInputText(e.target.value)}
              placeholder="Digite como cliente no WhatsApp..."
              className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!clientInputText.trim()}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl transition-colors"
              title="Disparar webhook Meta"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* ========================================================================= */}
        {/* 2. MULTIATENDIMENTO INBOX (5 Cols)                                        */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800 h-[740px] overflow-hidden">
          {/* Top Bar of Agent Workspace */}
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Caixa Multiatendimento
              </h3>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => setInboxFilter('mine')}
                className={`px-2 py-0.5 rounded ${
                  inboxFilter === 'mine' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                Meus
              </button>
              <button
                onClick={() => setInboxFilter('queued')}
                className={`px-2 py-0.5 rounded ${
                  inboxFilter === 'queued' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                Fila Geral
              </button>
              <button
                onClick={() => setInboxFilter('all')}
                className={`px-2 py-0.5 rounded ${
                  inboxFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                Todos
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 flex-1 overflow-hidden">
            {/* Ticket List Sub-pane (5 cols) */}
            <div className="col-span-5 border-r border-slate-800/80 overflow-y-auto divide-y divide-slate-800/50 bg-slate-950/40">
              {visibleTickets.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  Nenhum atendimento nesta fila
                </div>
              ) : (
                visibleTickets.map((t) => {
                  const contact = contacts.find((c) => c.id === t.contactId);
                  const isSelected = t.id === selectedTicket?.id;
                  const assignedAgent = users.find((u) => u.id === t.assignedUserId);

                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`w-full text-left p-3 transition-colors ${
                        isSelected
                          ? 'bg-slate-800/90 border-l-2 border-emerald-500'
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white truncate">
                          {contact?.name || 'Lead Anônimo'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(t.lastInteractionAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {t.lastMessagePreview || 'Conversa iniciada'}
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {t.department}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            t.status === 'OPEN'
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : 'text-amber-400 bg-amber-500/10'
                          }`}
                        >
                          {t.status}
                        </span>
                        {assignedAgent && (
                          <span className="text-[9px] text-slate-400 font-mono truncate ml-auto">
                            {assignedAgent.name.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Conversation Active Window (7 cols) */}
            <div className="col-span-7 flex flex-col bg-slate-950/70 overflow-hidden">
              {/* Conversation Header */}
              {selectedTicket && ticketContact ? (
                <>
                  <div className="p-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {ticketContact.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>{ticketContact.waId}</span>
                        <span>·</span>
                        <span className="text-emerald-400">{selectedTicket.protocolNumber}</span>
                      </div>
                    </div>

                    {/* Actions: Transfer & HSM */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setShowTransferModal(true)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                        title="Transferir para outro atendente"
                      >
                        <ArrowRightLeft className="w-3 h-3 text-sky-400" />
                        <span>Transferir</span>
                      </button>

                      <button
                        onClick={() => setShowHsmPicker(true)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                        title="Enviar Template HSM Aprovado pela Meta"
                      >
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>HSM</span>
                      </button>
                    </div>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
                    {ticketMessages.map((msg) => {
                      const isClient = msg.senderType === 'CONTACT';
                      const isInternal = msg.isInternalNote;

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            isInternal
                              ? 'items-center my-2'
                              : isClient
                              ? 'items-start'
                              : 'items-end'
                          }`}
                        >
                          {isInternal ? (
                            <div className="w-full p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px]">
                              <div className="flex items-center gap-1 font-semibold text-amber-400 mb-1">
                                <Lock className="w-3 h-3" />
                                <span>Nota Interna Privada ({msg.senderName || 'Atendente'}):</span>
                              </div>
                              <p className="italic">{msg.content}</p>
                            </div>
                          ) : (
                            <div
                              className={`max-w-[85%] rounded-xl p-2.5 shadow-sm ${
                                isClient
                                  ? 'bg-slate-800 text-slate-100 rounded-bl-xs'
                                  : 'bg-emerald-600 text-white rounded-br-xs'
                              }`}
                            >
                              <div className="text-[10px] font-mono opacity-80 mb-0.5">
                                {isClient ? ticketContact.name : msg.senderName || 'Atendente'}
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                              <div className="text-[9px] opacity-70 text-right mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Mode Selector: Normal Message vs Private Internal Note */}
                  <div className="px-3 py-1 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-white">
                        <input
                          type="checkbox"
                          checked={isInternalNote}
                          onChange={(e) => setIsInternalNote(e.target.checked)}
                          className="rounded bg-slate-800 border-slate-700 text-amber-500"
                        />
                        <span className={isInternalNote ? 'text-amber-400 font-semibold' : ''}>
                          Nota Interna (Invisível ao cliente)
                        </span>
                      </label>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      Enviando como: {activeUser.name}
                    </span>
                  </div>

                  {/* Send Form */}
                  <form
                    onSubmit={handleAgentSend}
                    className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={agentInputText}
                      onChange={(e) => setAgentInputText(e.target.value)}
                      placeholder={
                        isInternalNote
                          ? 'Escreva uma nota privada para a equipe...'
                          : 'Responder cliente no WhatsApp...'
                      }
                      className={`flex-1 px-3 py-2 text-xs rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none ${
                        isInternalNote
                          ? 'bg-amber-950/20 border border-amber-500/40 focus:border-amber-400'
                          : 'bg-slate-950 border border-slate-800 focus:border-emerald-500'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!agentInputText.trim()}
                      className={`p-2 disabled:opacity-50 text-white rounded-xl transition-colors ${
                        isInternalNote
                          ? 'bg-amber-600 hover:bg-amber-500'
                          : 'bg-emerald-600 hover:bg-emerald-500'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-slate-500">
                  Selecione um atendimento na lista à esquerda
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. EVENT BUS & WEBHOOK REALTIME LOGGER (3 Cols)                           */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 flex flex-col rounded-2xl bg-slate-950 border border-slate-800 h-[740px] overflow-hidden">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Event Bus & Webhooks
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              STOMP Live
            </span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs font-mono">
            {eventLogs.map((log) => {
              return (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span
                      className={`font-semibold ${
                        log.type.includes('WEBHOOK')
                          ? 'text-sky-400'
                          : log.type.includes('SIGNATURE')
                          ? 'text-emerald-400'
                          : log.type.includes('ROUND_ROBIN')
                          ? 'text-purple-400'
                          : log.type.includes('BOT')
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {log.type}
                    </span>
                    <span className="text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-tight">
                    {log.payloadSummary}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Infrastructure Insight footer */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Garantia de Entrega Meta:</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              Webhook validado via <code className="text-slate-200">X-Hub-Signature-256</code> e distribuído para os canais STOMP <code className="text-emerald-400">/topic/inbox</code>.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL TRANSFERÊNCIA DE ATENDIMENTO */}
      {showTransferModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-sky-400" />
              <h3 className="text-base font-bold text-white">
                Transferir Atendimento {selectedTicket.protocolNumber}
              </h3>
            </div>

            <p className="text-xs text-slate-400">
              O histórico integral de mensagens será preservado e ficará imediatamente disponível para o novo atendente responsável.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Destinatário (Atendente / Equipe)</label>
                <select
                  value={transferTargetUserId}
                  onChange={(e) => setTransferTargetUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                >
                  {users
                    .filter((u) => u.id !== activeUserId)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — Depto: {u.department} ({u.currentActiveChats}/{u.maxConcurrentChats} chats ativos)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nota de Contexto para o Novo Atendente</label>
                <textarea
                  rows={3}
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Ex: Cliente com dúvida específica sobre faturamento corporativo no boleto..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteTransfer}
                className="px-4 py-2 text-xs bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg"
              >
                Confirmar Transferência
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HSM TEMPLATES HOMOLOGADOS */}
      {showHsmPicker && ticketContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  Templates HSM Homologados pela Meta
                </h3>
              </div>
              <span className="text-[11px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Permitido fora da janela de 24h
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Selecione uma mensagem estruturada pré-aprovada para envio ativo ao destinatário{' '}
              <strong className="text-slate-200">{ticketContact.name}</strong> ({ticketContact.waId}):
            </p>

            <div className="space-y-3 max-h-[360px] overflow-y-auto">
              {META_APPROVED_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.name}
                  className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500/40 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-purple-400">
                      {tmpl.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {tmpl.category}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-white">{tmpl.header}</div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{tmpl.body}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Idioma: {tmpl.language}
                    </span>
                    <button
                      onClick={() => {
                        onSendHsmTemplate(ticketContact.id, tmpl.name);
                        setShowHsmPicker(false);
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                    >
                      Enviar Template
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowHsmPicker(false)}
                className="px-4 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
