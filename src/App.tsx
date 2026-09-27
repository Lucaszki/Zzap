import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ArchitectureView } from './components/ArchitectureView';
import { WebhooksAndSocketsView } from './components/WebhooksAndSocketsView';
import { LiveSimulator } from './components/LiveSimulator';
import { KanbanBoard } from './components/KanbanBoard';
import { RoadmapView } from './components/RoadmapView';
import { DashboardView } from './components/DashboardView';
import {
  INITIAL_USERS,
  INITIAL_CONTACTS,
  INITIAL_STAGES,
  INITIAL_TICKETS,
  INITIAL_MESSAGES,
  INITIAL_DEALS,
  INITIAL_CONSENT_LOGS,
  META_APPROVED_TEMPLATES
} from './data/mockData';
import {
  User,
  Contact,
  Ticket,
  Message,
  PipelineStage,
  Deal,
  ConsentLog,
  WebhookEventLog,
  Department
} from './types/crm';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');

  // Application State
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [stages] = useState<PipelineStage[]>(INITIAL_STAGES);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [consentLogs, setConsentLogs] = useState<ConsentLog[]>(INITIAL_CONSENT_LOGS);

  // Live Webhook Event Logs stream
  const [eventLogs, setEventLogs] = useState<WebhookEventLog[]>([
    {
      id: 'log-1',
      timestamp: '2026-09-26T18:15:00Z',
      type: 'WEBHOOK_RECEIVED',
      payloadSummary: 'Meta Webhook Ingress: wamid.HBgLMDU1MTE5OTg3... recebido de +55 11 99876-5432',
      status: 'SUCCESS'
    },
    {
      id: 'log-2',
      timestamp: '2026-09-26T18:15:01Z',
      type: 'SIGNATURE_VERIFIED',
      payloadSummary: 'HMAC-SHA256 validado com sucesso usando WhatsApp APP_SECRET (tempo: 2.1ms)',
      status: 'SUCCESS'
    },
    {
      id: 'log-3',
      timestamp: '2026-09-26T18:15:02Z',
      type: 'WEBSOCKET_PUSH',
      payloadSummary: 'Evento STOMP transmitido para /topic/inbox e /queue/usr-2 (Carlos Silva)',
      status: 'SUCCESS'
    }
  ]);

  const addLog = (
    type: WebhookEventLog['type'],
    payloadSummary: string,
    status: WebhookEventLog['status'] = 'SUCCESS'
  ) => {
    const newLog: WebhookEventLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      payloadSummary,
      status
    };
    setEventLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  // Reset to initial state
  const handleResetData = () => {
    setUsers(INITIAL_USERS);
    setContacts(INITIAL_CONTACTS);
    setTickets(INITIAL_TICKETS);
    setMessages(INITIAL_MESSAGES);
    setDeals(INITIAL_DEALS);
    setConsentLogs(INITIAL_CONSENT_LOGS);
    addLog('WEBHOOK_RECEIVED', 'Sistema restaurado para o estado inicial de homologação.');
  };

  // 1. Client sends message via simulated WhatsApp
  const handleSendMessageFromClient = (contactId: string, text: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;

    let ticket = tickets.find((t) => t.contactId === contactId && t.status !== 'CLOSED');

    // If no open ticket, create a new Ticket
    if (!ticket) {
      const newProtocol = `TKT-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      ticket = {
        id: `tkt-${Date.now()}`,
        protocolNumber: newProtocol,
        contactId,
        assignedUserId: null,
        department: 'GENERAL',
        status: 'BOT',
        priority: 'MEDIUM',
        lastMessagePreview: text,
        unreadCount: 1,
        lastInteractionAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      setTickets((prev) => [ticket!, ...prev]);
    }

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      ticketId: ticket.id,
      contactId,
      senderType: 'CONTACT',
      waMessageId: `wamid.HBgL${Math.random().toString(36).substring(2, 12)}`,
      messageType: 'TEXT',
      content: text,
      status: 'DELIVERED',
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, newMsg]);

    // Update ticket preview & interaction
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket!.id
          ? {
              ...t,
              lastMessagePreview: text,
              unreadCount: t.unreadCount + 1,
              lastInteractionAt: new Date().toISOString()
            }
          : t
      )
    );

    // Add webhook ingress logs
    addLog(
      'WEBHOOK_RECEIVED',
      `Meta POST /webhook: Mensagem recebida de ${contact.waId} ("${text.slice(0, 30)}...")`
    );
    addLog(
      'SIGNATURE_VERIFIED',
      `Header X-Hub-Signature-256 validado com sucesso em 1.8ms (Zero Spoofing).`
    );

    // =========================================================================
    // BOT TRIAGEM & ROUND-ROBIN ROUTING SIMULATION
    // =========================================================================
    const trimmed = text.trim();

    if (ticket.status === 'BOT' || !ticket.assignedUserId) {
      if (trimmed === '1') {
        // Option 1: Sales Department -> Round-Robin to Carlos Silva (usr-2)
        const targetAgent = users.find((u) => u.department === 'SALES' && u.isOnline) || users[1];

        setTimeout(() => {
          // Bot acknowledgment
          const botAckMsg: Message = {
            id: `msg-bot-${Date.now()}`,
            ticketId: ticket!.id,
            contactId,
            senderType: 'BOT',
            messageType: 'TEXT',
            content: 'Perfeito! Transferindo para nosso especialista de Vendas. Aguarde um instante...',
            status: 'READ',
            createdAt: new Date().toISOString()
          };

          // System round-robin assignment message
          const systemMsg: Message = {
            id: `msg-sys-${Date.now() + 1}`,
            ticketId: ticket!.id,
            contactId,
            senderType: 'SYSTEM',
            messageType: 'TEXT',
            content: `🔄 Atendimento distribuído via Round-Robin para ${targetAgent.name} (Vendas).`,
            status: 'DELIVERED',
            createdAt: new Date().toISOString()
          };

          setMessages((prev) => [...prev, botAckMsg, systemMsg]);

          // Update Ticket
          setTickets((prev) =>
            prev.map((t) =>
              t.id === ticket!.id
                ? {
                    ...t,
                    status: 'OPEN',
                    department: 'SALES',
                    assignedUserId: targetAgent.id,
                    lastInteractionAt: new Date().toISOString()
                  }
                : t
            )
          );

          // Auto create or move deal on Kanban if not already exists
          const existingDeal = deals.find((d) => d.contactId === contactId);
          if (!existingDeal) {
            const newDeal: Deal = {
              id: `deal-${Date.now()}`,
              title: `Oportunidade - ${contact.company || contact.name}`,
              contactId,
              pipelineStageId: 'stage-1', // Novo Lead
              assignedUserId: targetAgent.id,
              value: 12000,
              probability: 40,
              expectedCloseDate: '2026-10-31',
              lastStageMovedAt: new Date().toISOString(),
              lastSellerActivityAt: new Date().toISOString(),
              status: 'OPEN',
              tags: ['Inbound', 'WhatsApp'],
              createdAt: new Date().toISOString()
            };
            setDeals((prev) => [newDeal, ...prev]);
            addLog(
              'WEBSOCKET_PUSH',
              `Novo Lead registrado no Kanban (Deal: "${newDeal.title}") transmitido para /topic/kanban.`
            );
          }

          addLog(
            'ROUTING_ROUND_ROBIN',
            `Fila Vendas: Ticket ${ticket!.protocolNumber} roteado para ${targetAgent.name} (Concorrência: ${targetAgent.currentActiveChats + 1}/${targetAgent.maxConcurrentChats}).`
          );
          addLog(
            'WEBSOCKET_PUSH',
            `Evento despachado via STOMP para o atendente ${targetAgent.name} (/queue/${targetAgent.id}).`
          );
        }, 500);
      } else if (trimmed === '2') {
        // Option 2: Support -> Fernanda Lima
        const supportAgent = users.find((u) => u.department === 'SUPPORT') || users[2];

        setTimeout(() => {
          const botAckMsg: Message = {
            id: `msg-bot-${Date.now()}`,
            ticketId: ticket!.id,
            contactId,
            senderType: 'BOT',
            messageType: 'TEXT',
            content: 'Entendido! Direcionando para o Suporte Técnico Especializado...',
            status: 'READ',
            createdAt: new Date().toISOString()
          };

          const systemMsg: Message = {
            id: `msg-sys-${Date.now() + 1}`,
            ticketId: ticket!.id,
            contactId,
            senderType: 'SYSTEM',
            messageType: 'TEXT',
            content: `🔄 Atendimento distribuído para ${supportAgent.name} (Suporte Técnico).`,
            status: 'DELIVERED',
            createdAt: new Date().toISOString()
          };

          setMessages((prev) => [...prev, botAckMsg, systemMsg]);

          setTickets((prev) =>
            prev.map((t) =>
              t.id === ticket!.id
                ? {
                    ...t,
                    status: 'OPEN',
                    department: 'SUPPORT',
                    assignedUserId: supportAgent.id,
                    lastInteractionAt: new Date().toISOString()
                  }
                : t
            )
          );

          addLog(
            'ROUTING_ROUND_ROBIN',
            `Fila Suporte: Ticket ${ticket!.protocolNumber} atribuído para ${supportAgent.name}.`
          );
        }, 500);
      } else {
        // Send initial greeting with triage menu
        setTimeout(() => {
          const menuMsg: Message = {
            id: `msg-bot-${Date.now()}`,
            ticketId: ticket!.id,
            contactId,
            senderType: 'BOT',
            messageType: 'INTERACTIVE',
            content: `👋 Olá ${contact.name}! Seja bem-vindo ao atendimento oficial da OmniZap.\n\nPor favor, digite o número da opção desejada:\n\n1 - Falar com Consultor de Vendas & Planos\n2 - Suporte Técnico de Integração\n3 - Financeiro e Faturamento`,
            status: 'READ',
            createdAt: new Date().toISOString()
          };

          setMessages((prev) => [...prev, menuMsg]);
          addLog('BOT_INTERACTION', `Chatbot de Triagem disparou menu numérico para ${contact.waId}.`);
          addLog('WEBSOCKET_PUSH', `Push STOMP /topic/inbox atualizado.`);
        }, 600);
      }
    } else {
      // In progress ticket
      addLog(
        'WEBSOCKET_PUSH',
        `Mensagem em tempo real entregue na tela do atendente responsável.`
      );
    }
  };

  // 2. Agent sends reply or internal note
  const handleSendMessageFromAgent = (
    ticketId: string,
    text: string,
    isInternal: boolean
  ) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    const agent = users.find((u) => u.id === ticket.assignedUserId) || users[0];

    const newMsg: Message = {
      id: `msg-agent-${Date.now()}`,
      ticketId,
      contactId: ticket.contactId,
      senderType: 'AGENT',
      senderName: agent.name,
      messageType: 'TEXT',
      content: text,
      status: 'SENT',
      isInternalNote: isInternal,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, newMsg]);

    // Update ticket
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              lastMessagePreview: isInternal ? `[Nota Interna]: ${text}` : text,
              unreadCount: 0,
              lastInteractionAt: new Date().toISOString()
            }
          : t
      )
    );

    // If direct message to client, clear the 24h idle state on any deal associated with this contact!
    if (!isInternal) {
      setDeals((prev) =>
        prev.map((d) =>
          d.contactId === ticket.contactId
            ? {
                ...d,
                lastSellerActivityAt: new Date().toISOString(),
                tags: d.tags.filter((tag) => tag !== 'Alerta 24h')
              }
            : d
        )
      );

      addLog(
        'WEBSOCKET_PUSH',
        `Atendente ${agent.name} respondeu lead no WhatsApp. Régua de 24h redefinida com sucesso.`
      );
    } else {
      addLog(
        'WEBSOCKET_PUSH',
        `Nota interna privada registrada pelo atendente ${agent.name}. Visível apenas internamente.`
      );
    }
  };

  // 3. Ticket transfer with internal context note
  const handleTransferTicket = (
    ticketId: string,
    targetUserId: string,
    targetDept: Department,
    note: string
  ) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    const targetUser = users.find((u) => u.id === targetUserId);
    if (!ticket || !targetUser) return;

    const transferSystemMsg: Message = {
      id: `msg-transfer-${Date.now()}`,
      ticketId,
      contactId: ticket.contactId,
      senderType: 'SYSTEM',
      messageType: 'TEXT',
      content: `🔄 Atendimento transferido para ${targetUser.name} (${targetDept}). Histórico completo compartilhado.`,
      status: 'DELIVERED',
      createdAt: new Date().toISOString()
    };

    const newMsgs = [transferSystemMsg];

    if (note.trim()) {
      newMsgs.push({
        id: `msg-transfer-note-${Date.now() + 1}`,
        ticketId,
        contactId: ticket.contactId,
        senderType: 'AGENT',
        senderName: 'Nota de Transferência',
        messageType: 'TEXT',
        content: `Contexto da transferência: "${note.trim()}"`,
        status: 'SENT',
        isInternalNote: true,
        createdAt: new Date().toISOString()
      });
    }

    setMessages((prev) => [...prev, ...newMsgs]);

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              assignedUserId: targetUserId,
              department: targetDept,
              lastInteractionAt: new Date().toISOString()
            }
          : t
      )
    );

    addLog(
      'ROUTING_ROUND_ROBIN',
      `Ticket ${ticket.protocolNumber} transferido com sucesso para ${targetUser.name}. Histórico preservado.`
    );
  };

  // 4. Send Meta approved HSM template
  const handleSendHsmTemplate = (contactId: string, templateName: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    const ticket = tickets.find((t) => t.contactId === contactId);
    const template = META_APPROVED_TEMPLATES.find((t) => t.name === templateName);
    if (!contact || !template) return;

    // Build rendered text
    let rendered = template.body
      .replace('{{1}}', contact.name)
      .replace('{{2}}', contact.company || 'sua empresa')
      .replace('{{3}}', 'Carlos Silva');

    const hsmMsg: Message = {
      id: `msg-hsm-${Date.now()}`,
      ticketId: ticket ? ticket.id : 'tkt-hsm',
      contactId,
      senderType: 'AGENT',
      senderName: 'Disparo Oficial Meta HSM',
      messageType: 'TEMPLATE_HSM',
      templateName,
      content: `[TEMPLATE HSM OFICIAL APROVADO]\n${template.header}\n\n${rendered}`,
      status: 'DELIVERED',
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, hsmMsg]);

    // Clear 24h follow up alert on deal
    setDeals((prev) =>
      prev.map((d) =>
        d.contactId === contactId
          ? {
              ...d,
              lastSellerActivityAt: new Date().toISOString(),
              tags: d.tags.filter((tag) => tag !== 'Alerta 24h')
            }
          : d
      )
    );

    addLog(
      'HSM_DISPATCHED',
      `Meta Graph API v21.0: Template "${templateName}" disparado com sucesso para ${contact.waId}. Categoria: ${template.category}.`
    );
  };

  // 5. Move deal in Kanban
  const handleMoveDeal = (dealId: string, targetStageId: string) => {
    const targetStage = stages.find((s) => s.id === targetStageId);
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              pipelineStageId: targetStageId,
              lastStageMovedAt: new Date().toISOString(),
              lastSellerActivityAt: new Date().toISOString()
            }
          : d
      )
    );

    addLog(
      'WEBSOCKET_PUSH',
      `Oportunidade movida para a etapa "${targetStage?.name}" no Kanban. Sincronizado via /topic/kanban.`
    );
  };

  // 6. Create deal
  const handleCreateDeal = (newDealData: Partial<Deal>) => {
    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      title: newDealData.title || 'Nova Oportunidade',
      contactId: newDealData.contactId || contacts[0].id,
      pipelineStageId: newDealData.pipelineStageId || stages[0].id,
      assignedUserId: newDealData.assignedUserId || users[1].id,
      value: newDealData.value || 10000,
      probability: newDealData.probability || 50,
      expectedCloseDate: newDealData.expectedCloseDate || '2026-10-31',
      lastStageMovedAt: new Date().toISOString(),
      lastSellerActivityAt: new Date().toISOString(),
      status: 'OPEN',
      tags: newDealData.tags || ['Inbound'],
      createdAt: new Date().toISOString()
    };

    setDeals((prev) => [newDeal, ...prev]);
    addLog('WEBSOCKET_PUSH', `Nova oportunidade "${newDeal.title}" adicionada ao Kanban.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar with 3-Zone Contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetData={handleResetData}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeTab === 'simulator' && (
          <LiveSimulator
            users={users}
            contacts={contacts}
            tickets={tickets}
            messages={messages}
            deals={deals}
            eventLogs={eventLogs}
            onSendMessageFromClient={handleSendMessageFromClient}
            onSendMessageFromAgent={handleSendMessageFromAgent}
            onTransferTicket={handleTransferTicket}
            onSendHsmTemplate={handleSendHsmTemplate}
          />
        )}

        {activeTab === 'database' && <ArchitectureView />}

        {activeTab === 'webhooks' && <WebhooksAndSocketsView />}

        {activeTab === 'kanban' && (
          <KanbanBoard
            stages={stages}
            deals={deals}
            contacts={contacts}
            users={users}
            onMoveDeal={handleMoveDeal}
            onSendHsmFollowUp={(deal) =>
              handleSendHsmTemplate(deal.contactId, 'followup_proposta_comercial_24h')
            }
            onCreateDeal={handleCreateDeal}
          />
        )}

        {activeTab === 'roadmap' && <RoadmapView />}

        {activeTab === 'dashboard' && (
          <DashboardView
            users={users}
            deals={deals}
            consentLogs={consentLogs}
            tickets={tickets}
          />
        )}
      </main>

      {/* Clean quiet footer */}
      <footer className="py-4 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OmniZap CRM Enterprise · Arquitetura WhatsApp Cloud API Oficial & Spring Boot 3.3 / PostgreSQL 16</span>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>HMAC-SHA256 ✓</span>
            <span>·</span>
            <span>STOMP WebSockets ✓</span>
            <span>·</span>
            <span>Conformidade LGPD ✓</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
