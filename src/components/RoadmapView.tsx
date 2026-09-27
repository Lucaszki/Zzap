import React, { useState } from 'react';
import { GitBranch, GitPullRequest, CheckCircle2, ShieldCheck, Terminal, Cpu } from 'lucide-react';
import { ROADMAP_DATA } from '../data/roadmapAndContracts';
import { CodeBlock } from './CodeBlock';

export const RoadmapView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'phases' | 'git' | 'cicd'>('phases');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">Entregável Arquitetural 3</span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400">Engenharia de Software & Governança de Código</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight mt-1">
          Roadmap de Engenharia, Git Flow & Esteira CI/CD
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Plano de execução faseado em 3 marcos estratégicos (Conexão, Multiatendimento/CRM e Automações), acompanhado do padrão de ramificação no GitHub, convenção de commits semânticos e esteira automatizada com Testcontainers e SonarCloud.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('phases')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'phases'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          <span>Fases do Roadmap</span>
        </button>

        <button
          onClick={() => setActiveTab('git')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'git'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Estratégia Git & Branches</span>
        </button>

        <button
          onClick={() => setActiveTab('cicd')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'cicd'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Pipeline GitHub Actions</span>
        </button>
      </div>

      {/* Tab 1: Phased Roadmap */}
      {activeTab === 'phases' && (
        <div className="space-y-5">
          {ROADMAP_DATA.phases.map((phase, idx) => (
            <div
              key={phase.id}
              className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4 relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">{phase.title}</h3>
                    <span className="text-xs text-slate-400 font-mono">{phase.duration}</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 w-fit">
                  {phase.badge}
                </span>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed font-medium">
                {phase.objective}
              </div>

              {/* Deliverables Checklist */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  Entregáveis Técnicos & Features
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {phase.deliverables.map((item, dIdx) => (
                    <div key={dIdx} className="flex items-start gap-2 text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Branches */}
              <div className="pt-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                  Branches Vinculadas no Repositório (PRs)
                </span>
                <div className="flex flex-wrap gap-2">
                  {phase.branches.map((b) => (
                    <span
                      key={b}
                      className="px-2.5 py-1 text-xs font-mono bg-slate-950 text-slate-300 rounded border border-slate-800"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* Definition of Done */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs">
                <span className="font-semibold text-slate-300">Critério de Aceite (Definition of Done): </span>
                <span className="text-slate-400">{phase.definitionOfDone}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Git Strategy & Conventional Commits */}
      {activeTab === 'git' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Branching Strategy */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-semibold text-white">Estratégia de Branching (GitFlow Moderno)</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nenhum commit é permitido diretamente na branch <code className="text-slate-300">main</code> ou <code className="text-slate-300">develop</code>. Todos os deploys passam por Pull Requests com aprovação de 2 revisores (Tech Lead e Peer Reviewer).
              </p>

              <div className="space-y-2 pt-2">
                {ROADMAP_DATA.gitWorkflow.branches.map((b) => (
                  <div key={b.name} className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-xs">
                    <span className="font-mono text-emerald-400 font-semibold">{b.name}</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">{b.purpose}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Commit Conventions */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-semibold text-white">Padrão de Commits Convencionais (Semântico)</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Garante changelog automatizado com Semantic Release e rastreabilidade total de requisitos no backlog do Jira/GitHub Issues.
              </p>

              <div className="space-y-2 pt-2">
                {ROADMAP_DATA.gitWorkflow.commitConvention.map((c) => (
                  <div key={c.prefix} className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-xs">
                    <span className="font-mono text-amber-400 font-semibold">{c.prefix}</span>
                    <p className="text-slate-400 font-mono text-[11px] mt-0.5">{c.example}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pull Request Quality Checklist */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Checklist Obrigatório de Pull Request (Template de PR)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Testes unitários e de integração passando via Maven/Gradle</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Cobertura de código superior a 80% medida pelo JaCoCo</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero vulnerabilidades críticas ou altas no OWASP Dependency Check</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Migrations Liquibase / Flyway validadas com rollback script</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: CI/CD Pipeline YAML */}
      {activeTab === 'cicd' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
            <span>.github/workflows/ci-cd.yml</span>
            <span>GitHub Actions · Java 21 · PostgreSQL 16 Service Container · SonarQube</span>
          </div>
          <CodeBlock
            code={ROADMAP_DATA.ciCdYaml}
            language="yaml"
            title="GitHub Actions CI/CD Pipeline Configuration"
            maxHeight="max-h-[580px]"
          />
        </div>
      )}
    </div>
  );
};
