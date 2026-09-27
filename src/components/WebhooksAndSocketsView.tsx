import React, { useState } from 'react';
import { Network, ShieldCheck, ArrowRight, Radio, RefreshCw, Cpu } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import {
  SPRING_BOOT_CONTROLLER_CODE,
  SPRING_BOOT_SIGNATURE_VALIDATOR,
  SPRING_BOOT_WEBSOCKET_CODE,
  SPRING_BOOT_ROUND_ROBIN_CODE,
  SPRING_BOOT_FOLLOW_UP_JOB,
  SPRING_BOOT_HSM_SERVICE
} from '../data/architectureDocs';

export const WebhooksAndSocketsView: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<
    'controller' | 'validator' | 'websocket' | 'roundrobin' | 'followup' | 'hsm'
  >('controller');

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">Entregável Arquitetural 2</span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400">Processamento Assíncrono & Realtime Streaming</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight mt-1">
          Arquitetura de Webhooks Meta & WebSockets STOMP
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Fluxo de alta performance com desacoplamento assíncrono: a requisição HTTP da Meta é validada criptograficamente via HMAC-SHA256 e responde 200 OK em menos de 50ms, enquanto o motor de regras distribui o atendimento e notifica os clientes conectados via STOMP sobre SockJS.
        </p>
      </div>

      {/* Logical End-to-End Architectural Flow Diagram */}
      <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Network className="w-4 h-4 text-emerald-400" />
            <span>Diagrama Lógico de Integração End-to-End</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Latência Ingestão → WebSocket: ~80ms</span>
        </div>

        {/* Visual Step by Step Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {/* Step 1 */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 relative">
            <div className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">1. Ingress</div>
            <div className="text-xs font-semibold text-white mt-1">Meta Cloud API</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Dispara <code className="text-emerald-400 font-mono">POST /webhook</code> com payload de mensagem e header <code className="text-slate-300">X-Hub-Signature-256</code>.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 relative">
            <div className="text-[10px] font-mono text-amber-400 uppercase font-semibold">2. Segurança</div>
            <div className="text-xs font-semibold text-white mt-1">HMAC-SHA256</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Calcula HMAC do corpo com <code className="text-slate-300">APP_SECRET</code> em tempo constante para barrar spoofing. Retorna 200 OK imediato.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 relative">
            <div className="text-[10px] font-mono text-sky-400 uppercase font-semibold">3. Processamento</div>
            <div className="text-xs font-semibold text-white mt-1">Spring @Async Bus</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Cria contato se novo, deduplica por <code className="text-slate-300">wamid</code> e roteia para triagem bot ou atendente humano.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 relative">
            <div className="text-[10px] font-mono text-purple-400 uppercase font-semibold">4. Roteamento</div>
            <div className="text-xs font-semibold text-white mt-1">Round-Robin</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Seleciona atendente online com menor ocupação respeitando a capacidade máxima configurada no departamento.
            </p>
          </div>

          {/* Step 5 */}
          <div className="p-3 rounded-lg bg-slate-950 border border-emerald-500/30 bg-emerald-950/10 relative">
            <div className="text-[10px] font-mono text-emerald-300 uppercase font-semibold">5. Frontend Push</div>
            <div className="text-xs font-semibold text-white mt-1">STOMP WebSockets</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Emite evento nos tópicos <code className="text-emerald-400">/topic/inbox</code> e <code className="text-emerald-400">/topic/kanban</code> sem reload.
            </p>
          </div>
        </div>

        {/* ASCII Flow Chart for Senior Architecture Review */}
        <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800/90 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
          <pre>{`+---------------------------+       HTTPS POST (X-Hub-Signature-256)       +------------------------------------+
|  WhatsApp Cloud API       | -------------------------------------------> | WhatsAppWebhookController          |
|  (Meta Webhook Ingress)   | <------------------------------------------- |  -> Valida HMAC-SHA256 (AppSecret) |
+---------------------------+             HTTP 200 OK (< 50ms)             |  -> Retorna 200 OK imediatamente   |
                                                                           +-----------------+------------------+
                                                                                             |
                                                                             Spring @Async   | Event Publish
                                                                                             v
+---------------------------+       STOMP Push (/topic/inbox)              +------------------------------------+
| Clientes Web (React CRM)  | <------------------------------------------- | SimpMessagingTemplate              |
|  - Caixa de Atendimento   | <------------------------------------------- |  <- Dispatcher Round-Robin         |
|  - Kanban de Vendas       |       STOMP Push (/topic/kanban)             |  <- PostgreSQL 16 Transactional    |
+---------------------------+                                              +------------------------------------+`}</pre>
        </div>
      </div>

      {/* Spring Boot Implementation Code Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Código de Produção em Spring Boot (Java 21)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Padrão Enterprise DDD + Spring Security</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveCodeTab('controller')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeCodeTab === 'controller'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            WhatsAppWebhookController.java
          </button>

          <button
            onClick={() => setActiveCodeTab('validator')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeCodeTab === 'validator'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            MetaSignatureValidator.java (HMAC-SHA256)
          </button>

          <button
            onClick={() => setActiveCodeTab('websocket')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeCodeTab === 'websocket'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            WebSocketConfig.java (STOMP)
          </button>

          <button
            onClick={() => setActiveCodeTab('roundrobin')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeCodeTab === 'roundrobin'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            RoundRobinDispatcherService.java
          </button>

          <button
            onClick={() => setActiveCodeTab('followup')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeCodeTab === 'followup'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            FollowUpScheduledJob.java (24h)
          </button>

          <button
            onClick={() => setActiveCodeTab('hsm')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeCodeTab === 'hsm'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            WhatsAppHsmService.java (Graph API)
          </button>
        </div>

        {/* Code Content Container */}
        <div>
          {activeCodeTab === 'controller' && (
            <CodeBlock
              code={SPRING_BOOT_CONTROLLER_CODE}
              language="java"
              title="com.omnizap.crm.infrastructure.controller.WhatsAppWebhookController"
              maxHeight="max-h-[580px]"
            />
          )}

          {activeCodeTab === 'validator' && (
            <CodeBlock
              code={SPRING_BOOT_SIGNATURE_VALIDATOR}
              language="java"
              title="com.omnizap.crm.application.service.MetaSignatureValidator"
              maxHeight="max-h-[580px]"
            />
          )}

          {activeCodeTab === 'websocket' && (
            <CodeBlock
              code={SPRING_BOOT_WEBSOCKET_CODE}
              language="java"
              title="com.omnizap.crm.infrastructure.websocket.WebSocketConfig"
              maxHeight="max-h-[580px]"
            />
          )}

          {activeCodeTab === 'roundrobin' && (
            <CodeBlock
              code={SPRING_BOOT_ROUND_ROBIN_CODE}
              language="java"
              title="com.omnizap.crm.application.service.RoundRobinDispatcherService"
              maxHeight="max-h-[580px]"
            />
          )}

          {activeCodeTab === 'followup' && (
            <CodeBlock
              code={SPRING_BOOT_FOLLOW_UP_JOB}
              language="java"
              title="com.omnizap.crm.infrastructure.scheduler.FollowUpScheduledJob"
              maxHeight="max-h-[580px]"
            />
          )}

          {activeCodeTab === 'hsm' && (
            <CodeBlock
              code={SPRING_BOOT_HSM_SERVICE}
              language="java"
              title="com.omnizap.crm.application.service.WhatsAppHsmService"
              maxHeight="max-h-[580px]"
            />
          )}
        </div>
      </div>
    </div>
  );
};
