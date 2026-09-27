import { User, Contact, Ticket, Message, PipelineStage, Deal, ConsentLog, WebhookEventLog } from '../types/crm';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Mariana Costa',
    email: 'mariana.costa@empresa.com.br',
    role: 'ADMIN',
    department: 'GENERAL',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    isOnline: true,
    maxConcurrentChats: 10,
    currentActiveChats: 3
  },
  {
    id: 'usr-2',
    name: 'Carlos Silva',
    email: 'carlos.silva@empresa.com.br',
    role: 'AGENT',
    department: 'SALES',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    isOnline: true,
    maxConcurrentChats: 6,
    currentActiveChats: 4
  },
  {
    id: 'usr-3',
    name: 'Fernanda Lima',
    email: 'fernanda.lima@empresa.com.br',
    role: 'AGENT',
    department: 'SUPPORT',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    isOnline: true,
    maxConcurrentChats: 8,
    currentActiveChats: 2
  },
  {
    id: 'usr-4',
    name: 'Rodrigo Martins',
    email: 'rodrigo.martins@empresa.com.br',
    role: 'AGENT',
    department: 'FINANCE',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    isOnline: true,
    maxConcurrentChats: 6,
    currentActiveChats: 1
  }
];

export const INITIAL_STAGES: PipelineStage[] = [
  { id: 'stage-1', name: 'Novo Lead', orderIndex: 1, color: '#3B82F6' },
  { id: 'stage-2', name: 'Qualificação', orderIndex: 2, color: '#F59E0B' },
  { id: 'stage-3', name: 'Proposta Comercial', orderIndex: 3, color: '#8B5CF6' },
  { id: 'stage-4', name: 'Negociação', orderIndex: 4, color: '#EC4899' },
  { id: 'stage-5', name: 'Fechamento (Ganho)', orderIndex: 5, color: '#10B981' }
];

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'ct-1',
    waId: '5511998765432',
    name: 'Juliana Mendes',
    email: 'juliana.mendes@nexuscorp.com',
    company: 'Nexus Logística',
    customFields: { segmento: 'Transporte', tamanhoEquipe: 45, faturamento: 'R$ 1.5M/mês' },
    tags: ['VIP', 'Enterprise', 'Inbound'],
    optInStatus: 'OPTED_IN',
    optInTimestamp: '2026-09-24T10:15:00Z',
    optInSource: 'WhatsApp Website Click-to-Chat (Ad)',
    createdAt: '2026-09-24T10:15:00Z'
  },
  {
    id: 'ct-2',
    waId: '5521988887766',
    name: 'Bruno Albuquerque',
    email: 'bruno@albuquerquetech.io',
    company: 'Albuquerque Tech',
    customFields: { segmento: 'SaaS', tamanhoEquipe: 18, faturamento: 'R$ 350k/mês' },
    tags: ['Quente', 'Proposta Enviada'],
    optInStatus: 'OPTED_IN',
    optInTimestamp: '2026-09-20T14:30:00Z',
    optInSource: 'Formulário Landing Page + Consentimento LGPD',
    createdAt: '2026-09-20T14:30:00Z'
  },
  {
    id: 'ct-3',
    waId: '5531977776655',
    name: 'Camila Rocha',
    email: 'camila@clinicaradius.med.br',
    company: 'Clínica Radius',
    customFields: { segmento: 'Saúde', tamanhoEquipe: 8 },
    tags: ['Suporte', 'Dúvida Integração'],
    optInStatus: 'OPTED_IN',
    optInTimestamp: '2026-09-25T08:00:00Z',
    optInSource: 'Inbound Orgânico WhatsApp',
    createdAt: '2026-09-25T08:00:00Z'
  },
  {
    id: 'ct-4',
    waId: '5541991234567',
    name: 'Thiago Faria',
    email: 'thiago@grupoinovar.ind.br',
    company: 'Indústria Inovar',
    customFields: { segmento: 'Manufatura', tamanhoEquipe: 120 },
    tags: ['Pendente', 'Follow-up Urgente'],
    optInStatus: 'OPTED_IN',
    optInTimestamp: '2026-09-22T11:20:00Z',
    optInSource: 'WhatsApp Cloud API Opt-in Button',
    createdAt: '2026-09-22T11:20:00Z'
  }
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'tkt-1',
    protocolNumber: 'TKT-2026-00812',
    contactId: 'ct-1',
    assignedUserId: 'usr-2', // Carlos Silva
    department: 'SALES',
    status: 'OPEN',
    priority: 'HIGH',
    lastMessagePreview: 'Gostaria de agendar uma demonstração para a diretoria na quinta-feira.',
    unreadCount: 1,
    lastInteractionAt: '2026-09-26T18:15:00Z',
    createdAt: '2026-09-26T17:40:00Z'
  },
  {
    id: 'tkt-2',
    protocolNumber: 'TKT-2026-00794',
    contactId: 'ct-2',
    assignedUserId: 'usr-2', // Carlos Silva
    department: 'SALES',
    status: 'PENDING',
    priority: 'HIGH',
    lastMessagePreview: 'Aguardando validação da proposta comercial enviada.',
    unreadCount: 0,
    lastInteractionAt: '2026-09-25T11:00:00Z', // > 24 hours without seller response!
    createdAt: '2026-09-23T14:30:00Z'
  },
  {
    id: 'tkt-3',
    protocolNumber: 'TKT-2026-00815',
    contactId: 'ct-3',
    assignedUserId: 'usr-3', // Fernanda Lima
    department: 'SUPPORT',
    status: 'OPEN',
    priority: 'MEDIUM',
    lastMessagePreview: 'O webhook de confirmação de pagamento não disparou hoje às 08h.',
    unreadCount: 0,
    lastInteractionAt: '2026-09-26T18:30:00Z',
    createdAt: '2026-09-26T18:00:00Z'
  }
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    ticketId: 'tkt-1',
    contactId: 'ct-1',
    senderType: 'CONTACT',
    waMessageId: 'wamid.HBgLMDU1MTE5OTg3NjU0MzIVAgASGBQzQUQxRjQyQTA1NjI1',
    messageType: 'TEXT',
    content: 'Olá! Vimos o anúncio de vocês e queremos migrar 45 atendentes para o OmniZap.',
    status: 'READ',
    createdAt: '2026-09-26T17:40:00Z'
  },
  {
    id: 'msg-2',
    ticketId: 'tkt-1',
    contactId: 'ct-1',
    senderType: 'BOT',
    messageType: 'INTERACTIVE',
    content: '👋 Olá Juliana, seja bem-vinda ao OmniZap! Como podemos te ajudar hoje?\n\n1 - Falar com Consultor de Vendas\n2 - Suporte Técnico\n3 - Financeiro e Faturamento',
    status: 'READ',
    createdAt: '2026-09-26T17:40:05Z'
  },
  {
    id: 'msg-3',
    ticketId: 'tkt-1',
    contactId: 'ct-1',
    senderType: 'CONTACT',
    waMessageId: 'wamid.HBgLMDU1MTE5OTg3NjU0MzIVAgASGBQzQUQxRjQyQTA1NjI3',
    messageType: 'TEXT',
    content: '1',
    status: 'READ',
    createdAt: '2026-09-26T17:40:22Z'
  },
  {
    id: 'msg-4',
    ticketId: 'tkt-1',
    contactId: 'ct-1',
    senderType: 'SYSTEM',
    messageType: 'TEXT',
    content: '🔄 Atendimento distribuído via Round-Robin para Carlos Silva (Departamento de Vendas).',
    status: 'DELIVERED',
    createdAt: '2026-09-26T17:40:23Z'
  },
  {
    id: 'msg-5',
    ticketId: 'tkt-1',
    contactId: 'ct-1',
    senderType: 'AGENT',
    senderName: 'Carlos Silva',
    messageType: 'TEXT',
    content: 'Olá Juliana! Tudo bem? Me chamo Carlos e vou acompanhar a expansão da Nexus Logística. Temos uma infraestrutura dedicada pronta para 45 licenças.',
    status: 'READ',
    createdAt: '2026-09-26T17:42:00Z'
  },
  {
    id: 'msg-6',
    ticketId: 'tkt-1',
    contactId: 'ct-1',
    senderType: 'CONTACT',
    waMessageId: 'wamid.HBgLMDU1MTE5OTg3NjU0MzIVAgASGBQzQUQxRjQyQTA1NjI5',
    messageType: 'TEXT',
    content: 'Gostaria de agendar uma demonstração para a diretoria na quinta-feira.',
    status: 'READ',
    createdAt: '2026-09-26T18:15:00Z'
  },

  // Ticket 2 (Bruno Albuquerque - Deal na etapa Proposta com mais de 24h)
  {
    id: 'msg-201',
    ticketId: 'tkt-2',
    contactId: 'ct-2',
    senderType: 'AGENT',
    senderName: 'Carlos Silva',
    messageType: 'TEXT',
    content: 'Boa tarde Bruno, segue anexo nossa proposta técnica-comercial para o plano Enterprise.',
    status: 'DELIVERED',
    createdAt: '2026-09-24T16:00:00Z'
  },
  {
    id: 'msg-202',
    ticketId: 'tkt-2',
    contactId: 'ct-2',
    senderType: 'CONTACT',
    waMessageId: 'wamid.HBgLMDU1MjE5ODg4ODc3NjYVAgASGBQzQUQxRjQyQTA1OTAx',
    messageType: 'TEXT',
    content: 'Recebido Carlos! Vou avaliar com meu sócio até amanhã de manhã.',
    status: 'READ',
    createdAt: '2026-09-25T09:30:00Z'
  }
];

export const INITIAL_DEALS: Deal[] = [
  {
    id: 'deal-1',
    title: 'Plano Enterprise - 45 Atendentes Nexus',
    contactId: 'ct-1',
    pipelineStageId: 'stage-2', // Qualificação
    assignedUserId: 'usr-2',
    value: 14500,
    probability: 60,
    expectedCloseDate: '2026-10-15',
    lastStageMovedAt: '2026-09-26T17:40:00Z',
    lastSellerActivityAt: '2026-09-26T17:42:00Z',
    status: 'OPEN',
    tags: ['Enterprise', 'Alta Prioridade', 'Inbound'],
    createdAt: '2026-09-24T10:15:00Z'
  },
  {
    id: 'deal-2',
    title: 'Licenciamento Anual - Albuquerque Tech',
    contactId: 'ct-2',
    pipelineStageId: 'stage-3', // Proposta Comercial (>24h sem resposta!)
    assignedUserId: 'usr-2',
    value: 28900,
    probability: 75,
    expectedCloseDate: '2026-10-05',
    lastStageMovedAt: '2026-09-24T16:00:00Z',
    lastSellerActivityAt: '2026-09-24T16:00:00Z', // 50+ hours ago! Triggers alert
    status: 'OPEN',
    tags: ['SaaS', 'Proposta Enviada', 'Alerta 24h'],
    createdAt: '2026-09-20T14:30:00Z'
  },
  {
    id: 'deal-3',
    title: 'Expansão de Linhas - Indústria Inovar',
    contactId: 'ct-4',
    pipelineStageId: 'stage-4', // Negociação
    assignedUserId: 'usr-2',
    value: 42000,
    probability: 85,
    expectedCloseDate: '2026-10-02',
    lastStageMovedAt: '2026-09-25T14:00:00Z',
    lastSellerActivityAt: '2026-09-26T11:00:00Z',
    status: 'OPEN',
    tags: ['Indústria', 'Decisor Envolvido'],
    createdAt: '2026-09-22T11:20:00Z'
  },
  {
    id: 'deal-4',
    title: 'Migração de Telefonia - Clínica Radius',
    contactId: 'ct-3',
    pipelineStageId: 'stage-1', // Novo Lead
    assignedUserId: 'usr-1',
    value: 5800,
    probability: 30,
    expectedCloseDate: '2026-10-25',
    lastStageMovedAt: '2026-09-26T08:00:00Z',
    lastSellerActivityAt: '2026-09-26T08:00:00Z',
    status: 'OPEN',
    tags: ['Saúde', 'Trial'],
    createdAt: '2026-09-26T08:00:00Z'
  }
];

export const INITIAL_CONSENT_LOGS: ConsentLog[] = [
  {
    id: 'cs-1',
    contactId: 'ct-1',
    waId: '5511998765432',
    consentType: 'WHATSAPP_OPT_IN',
    action: 'GRANTED',
    ipAddress: '187.54.120.33',
    legalBasis: 'Art. 7, I da LGPD (Consentimento explícito via WhatsApp Opt-in CTA)',
    payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    createdAt: '2026-09-24T10:15:00Z'
  },
  {
    id: 'cs-2',
    contactId: 'ct-2',
    waId: '5521988887766',
    consentType: 'DATA_PROCESSING',
    action: 'GRANTED',
    ipAddress: '201.86.45.19',
    legalBasis: 'Art. 7, V da LGPD (Execução de contrato e procedimentos preliminares)',
    payloadHash: '4a53cee393c5b40078fc99a6cf600494be22b5de0a0e107df4fd9b00511e4028',
    createdAt: '2026-09-20T14:30:00Z'
  }
];

export const META_APPROVED_TEMPLATES = [
  {
    name: 'followup_proposta_comercial_24h',
    category: 'MARKETING',
    language: 'pt_BR',
    header: 'Acompanhamento de Proposta 📄',
    body: 'Olá {{1}}, tudo bem? Passando para saber se você e sua equipe conseguiram analisar a proposta que enviamos para {{2}}. Podemos tirar alguma dúvida técnica ou alinhar os prazos de implantação?',
    buttons: [
      { type: 'QUICK_REPLY', text: 'Sim, vamos agendar!' },
      { type: 'QUICK_REPLY', text: 'Ainda estamos avaliando' },
      { type: 'QUICK_REPLY', text: 'Não tenho interesse agora' }
    ]
  },
  {
    name: 'lembrete_reuniao_demonstracao',
    category: 'UTILITY',
    language: 'pt_BR',
    header: 'Lembrete de Demonstração Agendada 🗓️',
    body: 'Olá {{1}}, confirmando nossa sessão de demonstração do OmniZap hoje às {{2}} com o consultor {{3}}. O link de acesso foi enviado no seu e-mail corporativo.',
    buttons: [
      { type: 'URL', text: 'Entrar na Sala Virtual', url: 'https://meet.google.com/xyz' }
    ]
  },
  {
    name: 'pesquisa_satisfacao_atendimento',
    category: 'SERVICE',
    language: 'pt_BR',
    header: 'Como foi seu atendimento? ⭐',
    body: 'Olá {{1}}, seu protocolo {{2}} foi finalizado pelo especialista {{3}}. Como você avalia a sua experiência hoje de 1 a 5?',
    buttons: [
      { type: 'QUICK_REPLY', text: '⭐⭐⭐⭐⭐ Excelente' },
      { type: 'QUICK_REPLY', text: '⭐⭐⭐ Regular' }
    ]
  }
];
