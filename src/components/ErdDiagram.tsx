import React, { useState } from 'react';
import { Database, Key, Link2, Search, Table, ShieldCheck, Zap } from 'lucide-react';

interface SchemaTable {
  id: string;
  name: string;
  category: 'core' | 'messaging' | 'crm' | 'compliance';
  description: string;
  columns: {
    name: string;
    type: string;
    isPk?: boolean;
    isFk?: boolean;
    fkTarget?: string;
    isUnique?: boolean;
    isNullable?: boolean;
    description: string;
  }[];
}

const SCHEMA_TABLES: SchemaTable[] = [
  {
    id: 'users',
    name: 'users',
    category: 'core',
    description: 'Armazena atendentes, gestores e administradores com RBAC e capacidade de concorrência.',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, description: 'Chave primária gen_random_uuid()' },
      { name: 'name', type: 'VARCHAR(150)', isNullable: false, description: 'Nome completo do atendente' },
      { name: 'email', type: 'VARCHAR(255)', isUnique: true, isNullable: false, description: 'E-mail corporativo institucional' },
      { name: 'role', type: 'user_role_enum', isNullable: false, description: 'ADMIN, MANAGER ou AGENT' },
      { name: 'department', type: 'department_enum', isNullable: false, description: 'SALES, SUPPORT, FINANCE, GENERAL' },
      { name: 'is_online', type: 'BOOLEAN', isNullable: false, description: 'Status em tempo real para Round-Robin' },
      { name: 'max_concurrent_chats', type: 'INT', isNullable: false, description: 'Limite de atendimentos simultâneos' },
      { name: 'current_active_chats', type: 'INT', isNullable: false, description: 'Contador atual de conversas abertas' }
    ]
  },
  {
    id: 'contacts',
    name: 'contacts',
    category: 'core',
    description: 'Ficha central do Lead/Cliente no WhatsApp, com campos customizados em JSONB e consentimento LGPD.',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, description: 'Identificador único do Lead' },
      { name: 'wa_id', type: 'VARCHAR(30)', isUnique: true, isNullable: false, description: 'WhatsApp ID normalizado (Ex: 5511987654321)' },
      { name: 'name', type: 'VARCHAR(150)', description: 'Nome capturado do perfil da Meta ou formulário' },
      { name: 'email', type: 'VARCHAR(255)', description: 'E-mail comercial de contato' },
      { name: 'company', type: 'VARCHAR(150)', description: 'Razão social ou nome fantasia' },
      { name: 'custom_fields', type: 'JSONB', isNullable: false, description: 'Campos dinâmicos e metadados customizáveis' },
      { name: 'opt_in_status', type: 'opt_in_status_enum', isNullable: false, description: 'OPTED_IN, OPTED_OUT, PENDING' }
    ]
  },
  {
    id: 'tickets',
    name: 'tickets',
    category: 'messaging',
    description: 'Centralização de atendimentos do número corporativo único com protocolo e fila.',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, description: 'ID do Ticket' },
      { name: 'protocol_number', type: 'VARCHAR(50)', isUnique: true, isNullable: false, description: 'Número do protocolo (Ex: TKT-2026-00812)' },
      { name: 'contact_id', type: 'UUID', isFk: true, fkTarget: 'contacts.id', isNullable: false, description: 'Lead associado' },
      { name: 'assigned_user_id', type: 'UUID', isFk: true, fkTarget: 'users.id', description: 'Atendente responsável (via Round-Robin)' },
      { name: 'department', type: 'department_enum', isNullable: false, description: 'Departamento atual da conversa' },
      { name: 'status', type: 'ticket_status_enum', isNullable: false, description: 'BOT, QUEUED, OPEN, PENDING, RESOLVED, CLOSED' },
      { name: 'priority', type: 'ticket_priority_enum', isNullable: false, description: 'LOW, MEDIUM, HIGH, URGENT' },
      { name: 'last_interaction_at', type: 'TIMESTAMPTZ', isNullable: false, description: 'Timestamp para ordenação da fila' }
    ]
  },
  {
    id: 'messages',
    name: 'messages',
    category: 'messaging',
    description: 'Histórico auditável e imutável de mensagens trocadas, com wamid oficial da Meta.',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, description: 'Identificador único da mensagem' },
      { name: 'ticket_id', type: 'UUID', isFk: true, fkTarget: 'tickets.id', isNullable: false, description: 'Ticket a qual pertence' },
      { name: 'contact_id', type: 'UUID', isFk: true, fkTarget: 'contacts.id', isNullable: false, description: 'Remetente ou destinatário' },
      { name: 'sender_type', type: 'sender_type_enum', isNullable: false, description: 'CONTACT, AGENT, BOT, SYSTEM' },
      { name: 'wa_message_id', type: 'VARCHAR(100)', isUnique: true, description: 'wamid retornado pela Meta para deduplicação' },
      { name: 'message_type', type: 'message_type_enum', isNullable: false, description: 'TEXT, IMAGE, AUDIO, TEMPLATE_HSM' },
      { name: 'content', type: 'TEXT', isNullable: false, description: 'Corpo textual ou legenda da mensagem' },
      { name: 'is_internal_note', type: 'BOOLEAN', isNullable: false, description: 'Nota privada interna invisível ao cliente' }
    ]
  },
  {
    id: 'deals',
    name: 'deals',
    category: 'crm',
    description: 'Oportunidades no funil de vendas (Kanban) com valor, probabilidade e rastreamento de 24h.',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, description: 'ID da Oportunidade' },
      { name: 'title', type: 'VARCHAR(200)', isNullable: false, description: 'Título do negócio' },
      { name: 'contact_id', type: 'UUID', isFk: true, fkTarget: 'contacts.id', isNullable: false, description: 'Lead vinculado' },
      { name: 'pipeline_stage_id', type: 'UUID', isFk: true, fkTarget: 'pipeline_stages.id', isNullable: false, description: 'Etapa atual no Kanban' },
      { name: 'assigned_user_id', type: 'UUID', isFk: true, fkTarget: 'users.id', description: 'Vendedor responsável' },
      { name: 'value', type: 'NUMERIC(15,2)', isNullable: false, description: 'Valor estimado em BRL (R$)' },
      { name: 'last_seller_activity_at', type: 'TIMESTAMPTZ', isNullable: false, description: 'Gatilho do Job de Follow-up 24h' }
    ]
  },
  {
    id: 'consent_logs',
    name: 'consent_logs',
    category: 'compliance',
    description: 'Trilha de auditoria criptográfica de consentimento conforme Art. 7 da LGPD.',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, description: 'ID do registro de consentimento' },
      { name: 'contact_id', type: 'UUID', isFk: true, fkTarget: 'contacts.id', isNullable: false, description: 'Lead titular dos dados' },
      { name: 'wa_id', type: 'VARCHAR(30)', isNullable: false, description: 'Telefone do consentimento' },
      { name: 'consent_type', type: 'consent_type_enum', isNullable: false, description: 'WHATSAPP_OPT_IN, MARKETING' },
      { name: 'action', type: 'VARCHAR(20)', isNullable: false, description: 'GRANTED ou REVOKED' },
      { name: 'legal_basis', type: 'TEXT', isNullable: false, description: 'Fundamento legal conforme LGPD' },
      { name: 'payload_hash', type: 'VARCHAR(64)', isNullable: false, description: 'Hash SHA-256 do payload do opt-in' }
    ]
  }
];

export const ErdDiagram: React.FC = () => {
  const [selectedTableId, setSelectedTableId] = useState<string>('tickets');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedTable = SCHEMA_TABLES.find((t) => t.id === selectedTableId) || SCHEMA_TABLES[0];

  const filteredTables = SCHEMA_TABLES.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search and Category Summary */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-white">Explorador de Esquema Relacional (PostgreSQL)</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Relacionamentos 1:N com integridade referencial estrita, UUIDv4 nativo e campos semiestruturados JSONB.
          </p>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar tabelas ou colunas..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Grid of Tables and Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Table List */}
        <div className="lg:col-span-4 space-y-2">
          {filteredTables.map((tbl) => {
            const isSelected = tbl.id === selectedTableId;
            return (
              <button
                key={tbl.id}
                onClick={() => setSelectedTableId(tbl.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-950/20'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Table className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="font-mono text-xs font-semibold text-white">{tbl.name}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {tbl.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {tbl.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-mono">
                  <span>{tbl.columns.length} colunas</span>
                  <span>·</span>
                  <span>{tbl.columns.filter((c) => c.isFk).length} chaves estrangeiras</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Selected Table Schema Detail */}
        <div className="lg:col-span-8 p-5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h4 className="text-base font-semibold text-white font-mono">{selectedTable.name}</h4>
                <span className="text-xs text-slate-400 font-normal">({selectedTable.description})</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              <Zap className="w-3.5 h-3.5" />
              <span>PostgreSQL 16+</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase font-mono tracking-wider">
                  <th className="pb-2.5 font-medium">Coluna</th>
                  <th className="pb-2.5 font-medium">Tipo de Dado</th>
                  <th className="pb-2.5 font-medium">Restrições / Chaves</th>
                  <th className="pb-2.5 font-medium">Propósito no CRM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {selectedTable.columns.map((col) => (
                  <tr key={col.name} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 font-medium text-white flex items-center gap-1.5">
                      {col.isPk && (
                        <span title="Primary Key">
                          <Key className="w-3 h-3 text-amber-400 shrink-0" />
                        </span>
                      )}
                      {col.isFk && (
                        <span title="Foreign Key">
                          <Link2 className="w-3 h-3 text-sky-400 shrink-0" />
                        </span>
                      )}
                      {col.name}
                    </td>
                    <td className="py-2.5 text-emerald-400 font-mono text-[11px]">{col.type}</td>
                    <td className="py-2.5 text-[11px]">
                      {col.isPk && <span className="text-amber-300 font-medium">PRIMARY KEY</span>}
                      {col.isFk && (
                        <span className="text-sky-300 font-medium">
                          FK → {col.fkTarget}
                        </span>
                      )}
                      {col.isUnique && !col.isPk && <span className="text-purple-300">UNIQUE</span>}
                      {col.isNullable === false && !col.isPk && (
                        <span className="text-slate-400 ml-1">NOT NULL</span>
                      )}
                      {!col.isPk && !col.isFk && !col.isUnique && col.isNullable !== false && (
                        <span className="text-slate-500">NULLABLE</span>
                      )}
                    </td>
                    <td className="py-2.5 text-slate-300 font-sans text-xs">
                      {col.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Relational Insights Card */}
          <div className="mt-6 p-4 rounded-lg bg-slate-950/80 border border-slate-800/90 text-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Garantias de Integridade & Concorrência:</span>
            </div>
            <p className="text-slate-400 leading-relaxed font-sans">
              As transações utilizam nível de isolamento padrão <strong className="text-slate-200">READ COMMITTED</strong> com travas otimistas no Hibernate (<code className="text-emerald-400">@Version</code>) e <code className="text-emerald-400">SELECT FOR UPDATE</code> exclusivo na atribuição da fila Round-Robin para prevenir condições de corrida entre atendentes concorrentes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
