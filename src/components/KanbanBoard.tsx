import React, { useState } from 'react';
import { Deal, PipelineStage, Contact, User } from '../types/crm';
import { AlertTriangle, Send, DollarSign, User as UserIcon, Building, Clock, Plus, Tag as TagIcon, CheckCircle } from 'lucide-react';

interface KanbanBoardProps {
  stages: PipelineStage[];
  deals: Deal[];
  contacts: Contact[];
  users: User[];
  onMoveDeal: (dealId: string, targetStageId: string) => void;
  onSendHsmFollowUp: (deal: Deal) => void;
  onCreateDeal: (newDeal: Partial<Deal>) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  stages,
  deals,
  contacts,
  users,
  onMoveDeal,
  onSendHsmFollowUp,
  onCreateDeal
}) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContactId, setNewContactId] = useState(contacts[0]?.id || '');
  const [newStageId, setNewStageId] = useState(stages[0]?.id || '');
  const [newValue, setNewValue] = useState(15000);
  const [newUserId, setNewUserId] = useState(users[1]?.id || users[0]?.id || '');

  // Calculate 24h threshold
  const now = new Date('2026-09-26T18:41:52Z').getTime();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateDeal({
      title: newTitle,
      contactId: newContactId,
      pipelineStageId: newStageId,
      assignedUserId: newUserId,
      value: Number(newValue),
      probability: 50,
      expectedCloseDate: '2026-10-30',
      lastStageMovedAt: new Date().toISOString(),
      lastSellerActivityAt: new Date().toISOString(),
      status: 'OPEN',
      tags: ['Inbound', 'WhatsApp'],
      createdAt: new Date().toISOString()
    });
    setNewTitle('');
    setShowNewModal(false);
  };

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/40 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">CRM de Vendas</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Funil em Tempo Real Sincronizado com WhatsApp</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Pipeline Comercial & Gestão de Oportunidades (Kanban)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Cada nova mensagem de lead qualificado atualiza o funil instantaneamente. Negociações na etapa <strong className="text-purple-400 font-medium">Proposta Comercial</strong> com mais de 24h sem resposta ativam o alerta de follow-up com disparo de template HSM da Meta.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Oportunidade</span>
        </button>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.pipelineStageId === stage.id);
          const totalValue = stageDeals.reduce((acc, curr) => acc + curr.value, 0);

          return (
            <div
              key={stage.id}
              className="flex flex-col rounded-xl bg-slate-900/50 border border-slate-800/80 min-w-[280px] max-h-[750px]"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/80 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="text-xs font-bold text-white font-mono">{stage.name}</h3>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                    {stageDeals.length}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-2 font-medium">
                  Total: <span className="text-emerald-400">{formatCurrency(totalValue)}</span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {stageDeals.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-600 border border-dashed border-slate-800 rounded-lg">
                    Nenhuma oportunidade nesta etapa
                  </div>
                ) : (
                  stageDeals.map((deal) => {
                    const contact = contacts.find((c) => c.id === deal.contactId);
                    const user = users.find((u) => u.id === deal.assignedUserId);

                    // Check >24h follow-up condition specifically on Proposta stage
                    const lastActivityTime = new Date(deal.lastSellerActivityAt).getTime();
                    const idleTimeMs = now - lastActivityTime;
                    const isIdleOver24h = stage.name.includes('Proposta') && idleTimeMs > TWENTY_FOUR_HOURS_MS;
                    const hoursIdle = Math.floor(idleTimeMs / (1000 * 60 * 60));

                    return (
                      <div
                        key={deal.id}
                        className={`p-3.5 rounded-lg border transition-all ${
                          isIdleOver24h
                            ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-950/10'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Title and Value */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-semibold text-white leading-snug line-clamp-2">
                            {deal.title}
                          </h4>
                        </div>

                        <div className="text-xs font-bold text-emerald-400 font-mono mt-1.5 tabular-nums">
                          {formatCurrency(deal.value)}
                        </div>

                        {/* Contact details */}
                        <div className="space-y-1 mt-2.5 text-[11px] text-slate-400">
                          {contact && (
                            <div className="flex items-center gap-1.5 truncate">
                              <UserIcon className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="text-slate-300 font-medium truncate">{contact.name}</span>
                            </div>
                          )}

                          {contact?.company && (
                            <div className="flex items-center gap-1.5 truncate">
                              <Building className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{contact.company}</span>
                            </div>
                          )}

                          {user && (
                            <div className="flex items-center gap-1.5 truncate text-slate-500">
                              <span>Resp:</span>
                              <span className="text-slate-300 font-mono text-[10px]">{user.name}</span>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {deal.tags && deal.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {deal.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 24-HOUR FOLLOW-UP WARNING BANNER */}
                        {isIdleOver24h && (
                          <div className="mt-3 p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>Sem resposta há {hoursIdle}h!</span>
                            </div>
                            <p className="text-[10px] text-amber-200/90 leading-tight">
                              Regra comercial ativada: reengajar lead antes do esfriamento da proposta.
                            </p>
                            <button
                              onClick={() => onSendHsmFollowUp(deal)}
                              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 rounded transition-colors"
                            >
                              <Send className="w-3 h-3" />
                              <span>Disparar HSM Meta</span>
                            </button>
                          </div>
                        )}

                        {/* Stage movement quick actions */}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[10px]">
                          <select
                            value={deal.pipelineStageId}
                            onChange={(e) => onMoveDeal(deal.id, e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 font-mono text-[10px] focus:outline-none focus:border-emerald-500/50"
                          >
                            {stages.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>

                          <span className="text-slate-500 font-mono">
                            {deal.probability}% prob.
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nova Oportunidade */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Criar Nova Oportunidade (Deal)</h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Título da Negociação</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Licença OmniZap 25 Usuários"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Contato / Lead</label>
                <select
                  value={newContactId}
                  onChange={(e) => setNewContactId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                >
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''} - {c.waId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Etapa Inicial</label>
                  <select
                    value={newStageId}
                    onChange={(e) => setNewStageId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none font-mono"
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Vendedor Responsável</label>
                <select
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg"
                >
                  Salvar Oportunidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
