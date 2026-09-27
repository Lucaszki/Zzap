export const ROADMAP_DATA = {
  phases: [
    {
      id: 'fase-1',
      title: 'Fase 1: Conexão e Recebimento de Mensagens',
      duration: 'Sprints 1 e 2 (4 semanas)',
      badge: 'Infraestrutura & Ingestão',
      objective: 'Estabelecer comunicação segura e bidirecional com a Meta Cloud API, handshake de webhook e streaming em tempo real via WebSockets.',
      branches: ['feat/WHATS-101-meta-webhook-handshake', 'feat/WHATS-102-hmac-sha256-filter', 'feat/WHATS-103-stomp-websocket-broker'],
      deliverables: [
        'Configuração da Meta Cloud API (App ID, Phone Number ID, System User Token)',
        'Endpoint GET /api/v1/webhook/whatsapp com validação de hub.challenge e hub.verify_token',
        'Filtro de segurança HMAC-SHA256 validando header X-Hub-Signature-256 em tempo constante',
        'Ingestão assíncrona de Webhooks com Spring @Async / Event Bus descolado da resposta HTTP 200',
        'Configuração do broker STOMP SockJS com tópicos /topic/inbox e /queue/{userId}',
        'Recepção e persistência de mensagens de texto, imagens e áudios com deduplicação por wamid'
      ],
      definitionOfDone: 'Webhook responde à Meta em < 500ms; mensagens recebidas surgem no frontend via WebSocket sem reload de página; suíte de testes de integração com MockWebServer atinge > 85% de cobertura.'
    },
    {
      id: 'fase-2',
      title: 'Fase 2: Multiatendimento e CRM de Vendas',
      duration: 'Sprints 3 e 4 (4 semanas)',
      badge: 'Negócio & Distribuição',
      objective: 'Implementar fila de distribuição multiatendente (Round-Robin), transferência com histórico integral e funil Kanban de vendas interativo.',
      branches: ['feat/WHATS-201-round-robin-dispatcher', 'feat/WHATS-202-chat-transfer-history', 'feat/WHATS-203-kanban-sales-pipeline'],
      deliverables: [
        'Criação automática de Leads na tabela contacts no primeiro contato inbound',
        'Algoritmo Round-Robin thread-safe por departamento respeitando limite de concorrência por atendente',
        'Transferência interna de chats com protocolo, notas privadas e visibilidade completa do histórico',
        'Painel Kanban de Vendas drag-and-drop sincronizado via WebSockets com colunas de funil',
        'Criação automática de oportunidade (Deal) vinculada ao Lead e ao atendente selecionado',
        'Sistema de tags coloridas e campos customizados (JSONB) na ficha do cliente'
      ],
      definitionOfDone: 'Múltiplos atendentes interagem simultaneamente no mesmo número sem colisão; transferência de chat entrega o contexto imediato; movimentação de card no Kanban reflete em tempo real para os gestores.'
    },
    {
      id: 'fase-3',
      title: 'Fase 3: Automações, HSM e Governança LGPD',
      duration: 'Sprints 5 e 6 (4 semanas)',
      badge: 'Automação & Compliance',
      objective: 'Automatizar triagem com chatbot inicial, implementar disparos ativos de templates HSM da Meta, job de follow-up 24h e auditoria de consentimento LGPD.',
      branches: ['feat/WHATS-301-chatbot-menu-triagem', 'feat/WHATS-302-scheduled-follow-up-24h', 'feat/WHATS-303-hsm-graph-client', 'feat/WHATS-304-lgpd-consent-audit'],
      deliverables: [
        'Bot de boas-vindas com menu numérico de qualificação antes do transbordo humano',
        'Job agendado @Scheduled para detecção de propostas comerciais estagnadas há > 24 horas',
        'Integração oficial de Templates Estruturados (HSM) aprovados pela Meta para reengajamento seguro',
        'Dashboard com métricas gerenciais: TMR (Tempo Médio de Resposta), volume de conversas e taxa de conversão',
        'Matriz de permissões RBAC (ADMIN, MANAGER, AGENT) isolando visibilidade de relatórios',
        'Registro de consentimento LGPD com hash criptográfico, IP e base legal auditável'
      ],
      definitionOfDone: 'Leads são triados sem intervenção humana; alertas de 24h disparam no prazo; relatórios de TMR geram insights sem lentidão no banco PostgreSQL.'
    }
  ],
  gitWorkflow: {
    branchModel: 'GitFlow Moderno (Trunk-assisted)',
    branches: [
      { name: 'main', purpose: 'Produção estável. Somente commits via Merge de release/* ou hotfix/*' },
      { name: 'develop', purpose: 'Ambiente de integração contínua (Staging/Homologação)' },
      { name: 'feature/WHATS-xxx', purpose: 'Desenvolvimento isolado de requisitos a partir de develop' },
      { name: 'release/vX.Y.Z', purpose: 'Validação final de QA e homologação antes da subida em produção' },
      { name: 'hotfix/WHATS-xxx', purpose: 'Correções críticas diretas na main com cherry-pick para develop' }
    ],
    commitConvention: [
      { prefix: 'feat(webhook)', example: 'feat(webhook): adiciona validacao hmac-sha256 no header x-hub-signature' },
      { prefix: 'feat(routing)', example: 'feat(routing): implementa distribuicao round-robin por departamento' },
      { prefix: 'fix(websocket)', example: 'fix(websocket): reconecta socket apos perda transiente de rede' },
      { prefix: 'chore(db)', example: 'chore(db): adiciona indices compostos na tabela messages e tickets' },
      { prefix: 'test(crm)', example: 'test(crm): adiciona testes unitarios para transbordo de chatbot' }
    ]
  },
  ciCdYaml: `name: OmniZap CRM CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build-and-test:
    name: Build, Lint & Integration Tests
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: omnizap_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout Código
        uses: actions/checkout@v4

      - name: Setup Java 21 LTS
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Compilar e Executar Testes Unitários
        run: ./mvnw clean test

      - name: Testes de Integração com PostgreSQL & Testcontainers
        env:
          SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/omnizap_test
          SPRING_DATASOURCE_USERNAME: test_user
          SPRING_DATASOURCE_PASSWORD: test_password
        run: ./mvnw verify -P integration-tests

      - name: Análise de Qualidade SonarCloud
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: \${{ secrets.SONAR_TOKEN }}
        run: ./mvnw sonar:sonar -Dsonar.projectKey=omnizap-crm

      - name: Build da Imagem Docker
        if: github.ref == 'refs/heads/main'
        run: |
          docker build -t omnizap-crm-backend:\${{ github.sha }} .
`
};

export const API_CONTRACTS = [
  {
    method: 'POST',
    path: '/api/v1/webhook/whatsapp',
    description: 'Ingestão de eventos e mensagens da Meta Cloud API (Webhooks)',
    headers: {
      'Content-Type': 'application/json',
      'X-Hub-Signature-256': 'sha256=d3b07384d113edec49eaa6238ad5ff00...'
    },
    requestSample: {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '109823471928374',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '5511999998888',
                  phone_number_id: '104829102938472'
                },
                contacts: [
                  {
                    profile: { name: 'Juliana Mendes' },
                    wa_id: '5511998765432'
                  }
                ],
                messages: [
                  {
                    from: '5511998765432',
                    id: 'wamid.HBgLMDU1MTE5OTg3NjU0MzIVAgASGBQzQUQxRjQyQTA1NjI1',
                    timestamp: '1727376000',
                    text: { body: 'Olá! Gostaria de uma proposta corporativa.' },
                    type: 'text'
                  }
                ]
              },
              field: 'messages'
            }
          ]
        }
      ]
    },
    responseSample: {
      status: 200,
      body: 'OK (Processamento assíncrono despachado em 42ms)'
    }
  },
  {
    method: 'POST',
    path: '/api/v1/tickets/{id}/transfer',
    description: 'Transferência interna de atendimento com notas e preservação do histórico',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Content-Type': 'application/json'
    },
    requestSample: {
      targetUserId: 'usr-3',
      targetDepartment: 'SUPPORT',
      transferReason: 'Cliente com dúvida técnica sobre integração da API REST',
      internalNote: 'Cliente é VIP. Já autorizou o reenvio das credenciais de sandbox.'
    },
    responseSample: {
      ticketId: 'tkt-1',
      protocolNumber: 'TKT-2026-00812',
      previousUserId: 'usr-2',
      newUserId: 'usr-3',
      status: 'OPEN',
      department: 'SUPPORT',
      transferredAt: '2026-09-26T18:40:00Z'
    }
  },
  {
    method: 'POST',
    path: '/api/v1/messages/send-hsm',
    description: 'Disparo ativo de mensagem estruturada HSM aprovada pela Meta (Follow-up ou reengajamento fora da janela de 24h)',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Content-Type': 'application/json'
    },
    requestSample: {
      contactId: 'ct-2',
      templateName: 'followup_proposta_comercial_24h',
      languageCode: 'pt_BR',
      parameters: [
        { type: 'text', value: 'Bruno Albuquerque' },
        { type: 'text', value: 'Albuquerque Tech' }
      ]
    },
    responseSample: {
      status: 'QUEUED',
      metaMessageId: 'wamid.HBgLMDU1MjE5ODg4ODc3NjYVAgASGBQzQUQxRjQyQTA1OTAz',
      deliveredTimestamp: '2026-09-26T18:42:00Z',
      billingCategory: 'MARKETING'
    }
  },
  {
    method: 'POST',
    path: '/api/v1/deals/{id}/move-stage',
    description: 'Movimentação de oportunidade no Kanban de Vendas e atualização da régua de follow-up',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Content-Type': 'application/json'
    },
    requestSample: {
      newStageId: 'stage-3',
      notes: 'Proposta comercial apresentada com desconto especial de 10% anual.'
    },
    responseSample: {
      dealId: 'deal-2',
      pipelineStageId: 'stage-3',
      stageName: 'Proposta Comercial',
      lastSellerActivityAt: '2026-09-26T18:42:00Z',
      value: 28900.00,
      broadcastedToWebSockets: true
    }
  }
];
