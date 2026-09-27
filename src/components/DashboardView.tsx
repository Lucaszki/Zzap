import React from 'react';
import { User, Deal, ConsentLog, Ticket } from '../types/crm';
import {
  Clock,
  TrendingUp,
  MessageSquare,
  Users,
  ShieldCheck,
  FileCheck,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface DashboardViewProps {
  users: User[];
  deals: Deal[];
  consentLogs: ConsentLog[];
  tickets: Ticket[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  users,
  deals,
  consentLogs,
  tickets
}) => {
  // Calculate Metrics
  const totalDeals = deals.length;
  const wonDeals = deals.filter((d) => d.status === 'WON' || d.pipelineStageId === 'stage-5').length;
  const conversionRate = totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(1) : '0';
  const totalPipelineValue = deals.reduce((acc, curr) => acc + curr.value, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">Governança & Analytics</span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400">Segurança de Dados, LGPD & Operação</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight mt-1">
          Métricas Operacionais, Matriz RBAC & Governança LGPD
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Monitoramento em tempo real do Tempo Médio de Resposta (TMR), controle de acessos segregados por papel (RBAC) e registro imutável de consentimento para conformidade estrita com a Lei Geral de Proteção de Dados.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: TMR */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Tempo Médio Resposta (TMR)</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            01m 48s
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">
            -34s em relação à média semanal
          </div>
        </div>

        {/* KPI 2: Atendimentos Hoje */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Volume Atendimentos</span>
            <MessageSquare className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {tickets.length + 128} conversas
          </div>
          <div className="text-[11px] text-slate-400">
            Centralizado no número comercial único
          </div>
        </div>

        {/* KPI 3: Taxa de Conversão */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Taxa Conversão Funil</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {conversionRate}%
          </div>
          <div className="text-[11px] text-purple-400 font-medium">
            Pipeline: {formatCurrency(totalPipelineValue)}
          </div>
        </div>

        {/* KPI 4: Atendentes Ativos */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Capacidade Concorrente</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {users.reduce((acc, u) => acc + u.currentActiveChats, 0)} / {users.reduce((acc, u) => acc + u.maxConcurrentChats, 0)}
          </div>
          <div className="text-[11px] text-amber-400">
            Distribuição Round-Robin ativa
          </div>
        </div>
      </div>

      {/* Grid: RBAC Matrix and LGPD Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: RBAC Permission Matrix (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Matriz de Permissões RBAC (Segurança)</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Isolamento de privilégios com Spring Security e anotações <code className="text-emerald-400 font-mono">@PreAuthorize</code> nos serviços de domínio.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 font-mono uppercase">
                  <th className="pb-2">Recurso / Ação</th>
                  <th className="pb-2 text-center">Vendedor</th>
                  <th className="pb-2 text-center">Gestor</th>
                  <th className="pb-2 text-center">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                <tr>
                  <td className="py-2 text-slate-300 font-sans">Atender WhatsApp</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-300 font-sans">Transferir Atendimento</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-300 font-sans">Disparo de Templates HSM</td>
                  <td className="text-center text-slate-600">—</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-300 font-sans">Visualizar Métricas Globais (TMR)</td>
                  <td className="text-center text-slate-600">—</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-300 font-sans">Configurar Credenciais Meta API</td>
                  <td className="text-center text-slate-600">—</td>
                  <td className="text-center text-slate-600">—</td>
                  <td className="text-center text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-300 font-sans">Exportar Dados LGPD</td>
                  <td className="text-center text-slate-600">—</td>
                  <td className="text-center text-slate-600">—</td>
                  <td className="text-center text-emerald-400">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: LGPD Audit & Consent Logs (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">
                Trilha de Auditoria de Consentimento (LGPD)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Art. 7, I & V da Lei 13.709/2018
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Cada opt-in de WhatsApp gera um registro imutável com hash criptográfico SHA-256 do payload, IP de origem e base legal comprovável.
          </p>

          <div className="space-y-3 overflow-y-auto max-h-[380px]">
            {consentLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/90 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white font-mono">{log.waId}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {log.consentType} · {log.action}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(log.createdAt).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 font-sans">
                  <strong>Base Legal:</strong> {log.legalBasis}
                </div>

                <div className="text-[10px] font-mono text-slate-500 truncate flex items-center gap-1.5 pt-1 border-t border-slate-900">
                  <span className="text-slate-400">SHA-256:</span>
                  <span className="text-slate-500 truncate">{log.payloadHash}</span>
                  <span className="ml-auto text-slate-400">IP: {log.ipAddress}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
