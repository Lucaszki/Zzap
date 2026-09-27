import React, { useState } from 'react';
import { Database, FileCode, Layers, ShieldCheck, Download, Check } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { ErdDiagram } from './ErdDiagram';
import { POSTGRES_DDL, JPA_CLASSES } from '../data/architectureDocs';
import { API_CONTRACTS } from '../data/roadmapAndContracts';

export const ArchitectureView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'erd' | 'sql' | 'jpa' | 'contracts'>('erd');
  const [downloadedSql, setDownloadedSql] = useState(false);

  const handleDownloadSql = () => {
    const blob = new Blob([POSTGRES_DDL], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'omnizap_crm_postgresql_schema.sql');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadedSql(true);
    setTimeout(() => setDownloadedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/40 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">Entregável Arquitetural 1</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Modelagem Relacional de Alta Disponibilidade</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Modelo de Banco de Dados: PostgreSQL & JPA/Hibernate
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Estrutura relacional robusta normalizada na 3FN, com chaves UUIDv4, campos dinâmicos semiestruturados (JSONB com índices GIN), integridade referencial estrita e mapeamento objeto-relacional com Jakarta Persistence.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSql}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            {downloadedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">DDL Baixado!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Script .SQL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveSubTab('erd')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeSubTab === 'erd'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Diagrama Visual (ERD)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sql')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeSubTab === 'sql'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Script SQL (PostgreSQL DDL)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('jpa')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeSubTab === 'jpa'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Entidades JPA (Java 21)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('contracts')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeSubTab === 'contracts'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Contratos de API (REST)</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeSubTab === 'erd' && <ErdDiagram />}

      {activeSubTab === 'sql' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
            <span>script_database_schema_postgresql_v1.0.sql</span>
            <span>PostgreSQL 16+ · Dialeto Oficial · Índices B-Tree & GIN</span>
          </div>
          <CodeBlock
            code={POSTGRES_DDL}
            language="sql"
            title="PostgreSQL 16+ DDL Script Completo"
            maxHeight="max-h-[620px]"
          />
        </div>
      )}

      {activeSubTab === 'jpa' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
            <span>com.omnizap.crm.domain.entity.*</span>
            <span>Jakarta Persistence (Hibernate 6.4+) · Lombok · Java 21</span>
          </div>
          <CodeBlock
            code={JPA_CLASSES}
            language="java"
            title="Classes de Entidade JPA / Hibernate (Spring Data JPA)"
            maxHeight="max-h-[620px]"
          />
        </div>
      )}

      {activeSubTab === 'contracts' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            Especificações dos contratos de integração RESTful entre o WhatsApp Cloud API, o backend Spring Boot e a interface do CRM.
          </div>

          <div className="space-y-4">
            {API_CONTRACTS.map((contract) => (
              <div
                key={contract.path + contract.method}
                className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        contract.method === 'POST'
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {contract.method}
                    </span>
                    <span className="font-mono text-sm font-semibold text-white">{contract.path}</span>
                  </div>
                  <span className="text-xs text-slate-400">{contract.description}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 block mb-1.5 uppercase tracking-wider">
                      Request Body (Exemplo)
                    </span>
                    <CodeBlock
                      code={JSON.stringify(contract.requestSample, null, 2)}
                      language="json"
                      maxHeight="max-h-[220px]"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-slate-400 block mb-1.5 uppercase tracking-wider">
                      Response Payload (Exemplo)
                    </span>
                    <CodeBlock
                      code={JSON.stringify(contract.responseSample, null, 2)}
                      language="json"
                      maxHeight="max-h-[220px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
