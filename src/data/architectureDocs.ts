export const POSTGRES_DDL = `-- ============================================================================
-- OMNIZAP ENTERPRISE CRM - POSTGRESQL PRODUCTION DDL
-- Stack: PostgreSQL 16+ | UUIDv4 | JSONB | GIN Indexes | Audit Triggers
-- ============================================================================

-- Extensões necessárias para UUID e busca vetorial/texto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS DO SISTEMA
-- ============================================================================

CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'MANAGER', 'AGENT');
CREATE TYPE department_enum AS ENUM ('SALES', 'SUPPORT', 'FINANCE', 'GENERAL');
CREATE TYPE ticket_status_enum AS ENUM ('BOT', 'QUEUED', 'OPEN', 'PENDING', 'RESOLVED', 'CLOSED');
CREATE TYPE ticket_priority_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE sender_type_enum AS ENUM ('CONTACT', 'AGENT', 'BOT', 'SYSTEM');
CREATE TYPE message_type_enum AS ENUM ('TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'TEMPLATE_HSM', 'INTERACTIVE');
CREATE TYPE message_status_enum AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');
CREATE TYPE deal_status_enum AS ENUM ('OPEN', 'WON', 'LOST');
CREATE TYPE opt_in_status_enum AS ENUM ('OPTED_IN', 'OPTED_OUT', 'PENDING');
CREATE TYPE consent_type_enum AS ENUM ('WHATSAPP_OPT_IN', 'MARKETING', 'DATA_PROCESSING');

-- ============================================================================
-- 2. TABELA DE USUÁRIOS E ATENDENTES (RBAC)
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'AGENT',
    department department_enum NOT NULL DEFAULT 'GENERAL',
    avatar_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    max_concurrent_chats INT NOT NULL DEFAULT 8,
    current_active_chats INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_department_active ON users (department, is_active, is_online);

-- ============================================================================
-- 3. TABELA DE CONTATOS / CLIENTES (LEADS)
-- ============================================================================

CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wa_id VARCHAR(30) UNIQUE NOT NULL, -- Telefone normalizado com DDI (Ex: 5511987654321)
    name VARCHAR(150),
    email VARCHAR(255),
    company VARCHAR(150),
    profile_pic_url VARCHAR(500),
    custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    opt_in_status opt_in_status_enum NOT NULL DEFAULT 'PENDING',
    opt_in_timestamp TIMESTAMPTZ,
    opt_in_source VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices GIN para consultas flexíveis em campos customizados JSONB e busca por telefone
CREATE INDEX idx_contacts_wa_id ON contacts (wa_id);
CREATE INDEX idx_contacts_custom_fields_gin ON contacts USING gin (custom_fields);

-- ============================================================================
-- 4. TABELA DE TICKETS (ATENDIMENTOS NO NÚMERO CENTRALIZADO)
-- ============================================================================

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_number VARCHAR(50) UNIQUE NOT NULL, -- Ex: TKT-2026-000142
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department department_enum NOT NULL DEFAULT 'GENERAL',
    status ticket_status_enum NOT NULL DEFAULT 'BOT',
    priority ticket_priority_enum NOT NULL DEFAULT 'MEDIUM',
    last_message_preview TEXT,
    unread_count INT NOT NULL DEFAULT 0,
    last_interaction_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_contact_status ON tickets (contact_id, status);
CREATE INDEX idx_tickets_assigned_user ON tickets (assigned_user_id, status);
CREATE INDEX idx_tickets_department_status ON tickets (department, status);
CREATE INDEX idx_tickets_last_interaction ON tickets (last_interaction_at DESC);

-- ============================================================================
-- 5. TABELA DE MENSAGENS (HISTÓRICO INTEGRAL COM METADATA META)
-- ============================================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    sender_type sender_type_enum NOT NULL,
    sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    wa_message_id VARCHAR(100) UNIQUE, -- ID oficial retornado pela Meta (wamid.HBgL...)
    message_type message_type_enum NOT NULL DEFAULT 'TEXT',
    content TEXT NOT NULL,
    media_url VARCHAR(1000),
    template_name VARCHAR(100),
    status message_status_enum NOT NULL DEFAULT 'SENT',
    is_internal_note BOOLEAN NOT NULL DEFAULT FALSE, -- Notas privadas de atendentes
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- Armazena contexto do webhook bruto
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_ticket_created ON messages (ticket_id, created_at ASC);
CREATE INDEX idx_messages_wa_id ON messages (wa_message_id);

-- ============================================================================
-- 6. FUNIL DE VENDAS (PIPELINES, ETAPAS & DEALS NO KANBAN)
-- ============================================================================

CREATE TABLE pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    order_index INT NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    pipeline_stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    probability INT NOT NULL DEFAULT 50, -- 0 a 100%
    expected_close_date DATE,
    last_stage_moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seller_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Para o trigger de 24h
    status deal_status_enum NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deals_stage_status ON deals (pipeline_stage_id, status);
CREATE INDEX idx_deals_seller_activity ON deals (last_seller_activity_at, pipeline_stage_id);

-- ============================================================================
-- 7. SISTEMA DE TAGS E ETIQUETAS
-- ============================================================================

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#64748B'
);

CREATE TABLE contact_tags (
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (contact_id, tag_id)
);

CREATE TABLE deal_tags (
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (deal_id, tag_id)
);

-- ============================================================================
-- 8. REGISTRO DE CONSENTIMENTO E AUDITORIA (LGPD)
-- ============================================================================

CREATE TABLE consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    wa_id VARCHAR(30) NOT NULL,
    consent_type consent_type_enum NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'GRANTED' ou 'REVOKED'
    ip_address VARCHAR(50),
    legal_basis TEXT NOT NULL,
    payload_hash VARCHAR(64) NOT NULL, -- SHA-256 do payload do opt-in
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consent_contact_wa ON consent_logs (contact_id, wa_id);

-- ============================================================================
-- 9. TRIGGERS DE ATUALIZAÇÃO AUTOMÁTICA (updated_at)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
`;

export const JPA_CLASSES = `// ============================================================================
// OMNIZAP ENTERPRISE CRM - JPA / HIBERNATE ENTITY CLASSES
// Package: com.omnizap.crm.domain.entity
// Jakarta Persistence (Hibernate 6.4+) + Lombok
// ============================================================================

package com.omnizap.crm.domain.entity;

import com.omnizap.crm.domain.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

// ----------------------------------------------------------------------------
// 1. User Entity (Atendentes e Gestores com RBAC)
// ----------------------------------------------------------------------------

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_dept_active", columnList = "department, isActive, isOnline")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private UserRole role = UserRole.AGENT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private Department department = Department.GENERAL;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_online", nullable = false)
    @Builder.Default
    private Boolean isOnline = false;

    @Column(name = "max_concurrent_chats", nullable = false)
    @Builder.Default
    private Integer maxConcurrentChats = 8;

    @Column(name = "current_active_chats", nullable = false)
    @Builder.Default
    private Integer currentActiveChats = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}

// ----------------------------------------------------------------------------
// 2. Contact Entity (Lead no WhatsApp com JSONB e LGPD)
// ----------------------------------------------------------------------------

@Entity
@Table(name = "contacts", indexes = {
    @Index(name = "idx_contacts_wa_id", columnList = "wa_id", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "wa_id", nullable = false, unique = true, length = 30)
    private String waId; // Ex: 5511987654321

    @Column(length = 150)
    private String name;

    @Column(length = 255)
    private String email;

    @Column(length = 150)
    private String company;

    @Column(name = "profile_pic_url", length = 500)
    private String profilePicUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_fields", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> customFields = new HashMap<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "opt_in_status", nullable = false, length = 20)
    @Builder.Default
    private OptInStatus optInStatus = OptInStatus.PENDING;

    @Column(name = "opt_in_timestamp")
    private Instant optInTimestamp;

    @Column(name = "opt_in_source", length = 255)
    private String optInSource;

    @ManyToMany
    @JoinTable(
        name = "contact_tags",
        joinColumns = @JoinColumn(name = "contact_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}

// ----------------------------------------------------------------------------
// 3. Ticket Entity (Atendimento Centralizado no WhatsApp)
// ----------------------------------------------------------------------------

@Entity
@Table(name = "tickets", indexes = {
    @Index(name = "idx_tickets_assigned", columnList = "assigned_user_id, status"),
    @Index(name = "idx_tickets_contact", columnList = "contact_id, status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "protocol_number", nullable = false, unique = true, length = 50)
    private String protocolNumber; // Ex: TKT-2026-00492

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contact_id", nullable = false)
    private Contact contact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_user_id")
    private User assignedUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private Department department = Department.GENERAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private TicketStatus status = TicketStatus.BOT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private TicketPriority priority = TicketPriority.MEDIUM;

    @Column(name = "last_message_preview", columnDefinition = "TEXT")
    private String lastMessagePreview;

    @Column(name = "unread_count", nullable = false)
    @Builder.Default
    private Integer unreadCount = 0;

    @Column(name = "last_interaction_at", nullable = false)
    @Builder.Default
    private Instant lastInteractionAt = Instant.now();

    @Column(name = "closed_at")
    private Instant closedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}

// ----------------------------------------------------------------------------
// 4. Message Entity (Histórico Completo com Webhook Metadata)
// ----------------------------------------------------------------------------

@Entity
@Table(name = "messages", indexes = {
    @Index(name = "idx_messages_ticket_date", columnList = "ticket_id, created_at"),
    @Index(name = "idx_messages_wamid", columnList = "wa_message_id", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contact_id", nullable = false)
    private Contact contact;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false, length = 20)
    private SenderType senderType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_user_id")
    private User senderUser;

    @Column(name = "wa_message_id", length = 100)
    private String waMessageId;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 30)
    @Builder.Default
    private MessageType messageType = MessageType.TEXT;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "media_url", length = 1000)
    private String mediaUrl;

    @Column(name = "template_name", length = 100)
    private String templateName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private MessageStatus status = MessageStatus.SENT;

    @Column(name = "is_internal_note", nullable = false)
    @Builder.Default
    private Boolean isInternalNote = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}

// ----------------------------------------------------------------------------
// 5. Deal Entity (Kanban de Vendas & Regra de Follow-up 24h)
// ----------------------------------------------------------------------------

@Entity
@Table(name = "deals", indexes = {
    @Index(name = "idx_deals_stage_status", columnList = "pipeline_stage_id, status"),
    @Index(name = "idx_deals_seller_activity", columnList = "last_seller_activity_at, pipeline_stage_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Deal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contact_id", nullable = false)
    private Contact contact;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pipeline_stage_id", nullable = false)
    private PipelineStage pipelineStage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_user_id")
    private User assignedUser;

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal value = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private Integer probability = 50;

    @Column(name = "expected_close_date")
    private LocalDate expectedCloseDate;

    @Column(name = "last_stage_moved_at", nullable = false)
    @Builder.Default
    private Instant lastStageMovedAt = Instant.now();

    /**
     * Timestamp crítico para o job de automação de Follow-up (> 24h sem resposta do vendedor).
     */
    @Column(name = "last_seller_activity_at", nullable = false)
    @Builder.Default
    private Instant lastSellerActivityAt = Instant.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private DealStatus status = DealStatus.OPEN;

    @ManyToMany
    @JoinTable(
        name = "deal_tags",
        joinColumns = @JoinColumn(name = "deal_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
`;

export const SPRING_BOOT_CONTROLLER_CODE = `package com.omnizap.crm.infrastructure.controller;

import com.omnizap.crm.application.service.MetaSignatureValidator;
import com.omnizap.crm.application.service.WhatsAppWebhookProcessor;
import com.omnizap.crm.infrastructure.dto.MetaWebhookPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller oficial para handshake e ingestão de Webhooks do WhatsApp Cloud API.
 * Responde 200 OK imediatamente para a Meta e delega processamento assíncrono.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/webhook/whatsapp")
@RequiredArgsConstructor
public class WhatsAppWebhookController {

    private final MetaSignatureValidator signatureValidator;
    private final WhatsAppWebhookProcessor webhookProcessor;

    @Value("\${whatsapp.webhook.verify-token}")
    private String verifyToken;

    /**
     * Handshake inicial exigido pela Meta para validação do endpoint.
     */
    @GetMapping
    public ResponseEntity<String> verifyWebhook(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String token,
            @RequestParam("hub.challenge") String challenge) {

        log.info("Recebida solicitacao de verificacao da Meta. Mode: {}", mode);

        if ("subscribe".equals(mode) && verifyToken.equals(token)) {
            log.info("Webhook verificado com sucesso pelo token de subscricao.");
            return ResponseEntity.ok(challenge);
        }

        log.warn("Falha de autenticacao no handshake do Webhook. Token incorreto.");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification token mismatch");
    }

    /**
     * Ingestão de mensagens, status de entrega e interações em tempo real.
     */
    @PostMapping
    public ResponseEntity<Void> receiveWebhook(
            @RequestHeader(value = "X-Hub-Signature-256", required = true) String signatureHeader,
            @RequestBody String rawPayload,
            @org.springframework.web.bind.annotation.RequestBody MetaWebhookPayload parsedPayload) {

        // 1. Validação de integridade criptográfica HMAC-SHA256
        if (!signatureValidator.isValidSignature(rawPayload, signatureHeader)) {
            log.error("Assinatura invalida no payload da Meta! X-Hub-Signature-256: {}", signatureHeader);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // 2. Despacho assíncrono para fila de processamento (Zero Latency HTTP Response)
        webhookProcessor.processPayloadAsync(parsedPayload);

        // 3. A Meta exige HTTP 200 OK em menos de 5 segundos para não reenviar eventos
        return ResponseEntity.ok().build();
    }
}
`;

export const SPRING_BOOT_SIGNATURE_VALIDATOR = `package com.omnizap.crm.application.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.HmacAlgorithms;
import org.apache.commons.codec.digest.HmacUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Validador de integridade HMAC-SHA256 conforme padrão oficial da Meta Cloud API.
 * Evita ataques de spoofing ou injeção de mensagens forjadas no webhook.
 */
@Slf4j
@Service
public class MetaSignatureValidator {

    @Value("\${whatsapp.app-secret}")
    private String appSecret;

    public boolean isValidSignature(String payload, String signatureHeader) {
        if (signatureHeader == null || !signatureHeader.startsWith("sha256=")) {
            log.warn("Header X-Hub-Signature-256 ausente ou malformatado.");
            return false;
        }

        String expectedSignature = signatureHeader.substring(7); // Remove o prefixo 'sha256='

        try {
            // Calcula HMAC-SHA256 com o APP_SECRET da Meta
            String computedSignature = new HmacUtils(HmacAlgorithms.HMAC_SHA_256, appSecret)
                    .hmacHex(payload.getBytes(StandardCharsets.UTF_8));

            // Comparação em tempo constante para mitigar Timing Attacks
            return MessageDigest.isEqual(
                    expectedSignature.getBytes(StandardCharsets.UTF_8),
                    computedSignature.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.error("Erro critico ao validar assinatura HMAC: {}", e.getMessage());
            return false;
        }
    }
}
`;

export const SPRING_BOOT_WEBSOCKET_CODE = `package com.omnizap.crm.infrastructure.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuração STOMP Message Broker sobre WebSockets com fallback SockJS.
 * Distribui atualizações em tempo real para os clientes conectados.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Tópicos públicos e filas de usuário privado
        config.enableSimpleBroker("/topic", "/queue");
        
        // Prefixo para mensagens enviadas pelo cliente frontend ao backend
        config.setApplicationDestinationPrefixes("/app");
        
        // Prefixo para mensagens direcionadas a um usuário específico
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint de handshake WebSocket utilizado pelo frontend React
        registry.addEndpoint("/ws-crm")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
`;

export const SPRING_BOOT_ROUND_ROBIN_CODE = `package com.omnizap.crm.application.service;

import com.omnizap.crm.domain.entity.Ticket;
import com.omnizap.crm.domain.entity.User;
import com.omnizap.crm.domain.enums.Department;
import com.omnizap.crm.domain.enums.TicketStatus;
import com.omnizap.crm.domain.repository.TicketRepository;
import com.omnizap.crm.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Motor de Distribuição Automática de Atendimentos (Round-Robin Departamental).
 * Thread-safe com índices atômicos por departamento e verificação de concorrência máxima.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RoundRobinDispatcherService {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // Ponteiro circular atômico individual por departamento
    private final ConcurrentHashMap<Department, AtomicInteger> departmentPointers = new ConcurrentHashMap<>();

    @Transactional
    public User assignTicketToAvailableAgent(Ticket ticket, Department department) {
        // 1. Busca atendentes ativos, online e com capacidade disponível
        List<User> availableAgents = userRepository.findAvailableAgentsByDepartment(department);

        if (availableAgents.isEmpty()) {
            log.warn("Nenhum atendente disponivel para o departamento {}. Ticket {} colocado em fila de espera.",
                    department, ticket.getProtocolNumber());
            ticket.setStatus(TicketStatus.QUEUED);
            ticket.setDepartment(department);
            ticketRepository.save(ticket);

            // Notifica o canal geral de fila no WebSocket
            messagingTemplate.convertAndSend("/topic/queue/unassigned", ticket);
            return null;
        }

        // 2. Calcula próximo atendente na rotação Round-Robin
        AtomicInteger pointer = departmentPointers.computeIfAbsent(department, k -> new AtomicInteger(0));
        int nextIndex = Math.abs(pointer.getAndIncrement() % availableAgents.size());
        User selectedAgent = availableAgents.get(nextIndex);

        // 3. Atualiza Ticket e incrementa contagem ativa do atendente
        ticket.setAssignedUser(selectedAgent);
        ticket.setDepartment(department);
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setLastInteractionAt(Instant.now());
        ticketRepository.save(ticket);

        selectedAgent.setCurrentActiveChats(selectedAgent.getCurrentActiveChats() + 1);
        userRepository.save(selectedAgent);

        log.info("Ticket {} atribuido com sucesso para {} ({}) via Round-Robin.",
                ticket.getProtocolNumber(), selectedAgent.getName(), department);

        // 4. Dispara evento WebSocket instantâneo para a caixa de entrada do atendente
        messagingTemplate.convertAndSendToUser(
                selectedAgent.getId().toString(),
                "/queue/assigned-tickets",
                ticket
        );

        // 5. Atualiza o Kanban de Vendas caso haja uma negociação associada
        messagingTemplate.convertAndSend("/topic/kanban/deal-updated", ticket);

        return selectedAgent;
    }
}
`;

export const SPRING_BOOT_FOLLOW_UP_JOB = `package com.omnizap.crm.infrastructure.scheduler;

import com.omnizap.crm.application.service.WhatsAppHsmService;
import com.omnizap.crm.domain.entity.Deal;
import com.omnizap.crm.domain.enums.DealStatus;
import com.omnizap.crm.domain.repository.DealRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Automação de Follow-up Comercial:
 * Identifica leads na etapa 'Proposta Comercial' que estão há mais de 24 horas sem
 * interação e dispara alertas aos vendedores e templates HSM aprovados pela Meta.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FollowUpScheduledJob {

    private final DealRepository dealRepository;
    private final WhatsAppHsmService hsmService;
    private final SimpMessagingTemplate messagingTemplate;

    // Executa a cada 15 minutos
    @Scheduled(cron = "0 */15 * * * *")
    public void scanIdleProposals() {
        Instant deadline = Instant.now().minus(24, ChronoUnit.HOURS);
        log.info("Executando varredura de Follow-up 24h para propostas inativas antes de: {}", deadline);

        // Busca deals na etapa 'Proposta Comercial' com lastSellerActivityAt < deadline
        List<Deal> idleDeals = dealRepository.findIdleProposals(
                "Proposta Comercial",
                DealStatus.OPEN,
                deadline
        );

        for (Deal deal : idleDeals) {
            log.warn("Alerta de Follow-up: Deal '{}' (ID: {}) sem atividade ha mais de 24h!",
                    deal.getTitle(), deal.getId());

            // 1. Notifica o vendedor e gestores via WebSocket
            messagingTemplate.convertAndSend("/topic/kanban/follow-up-alert", deal);

            // 2. Disparo opcional de Template Estruturado HSM para reengajamento
            // Observância da janela de 24 horas do WhatsApp: requer HSM homologado
            hsmService.sendFollowUpTemplate(deal.getContact(), deal);
        }
    }
}
`;

export const SPRING_BOOT_HSM_SERVICE = `package com.omnizap.crm.application.service;

import com.omnizap.crm.domain.entity.Contact;
import com.omnizap.crm.domain.entity.Deal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Cliente para emissão de Templates HSM Oficiais via Meta Graph API v21.0.
 * Garante entrega fora da janela de 24h sem risco de bloqueio do número.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WhatsAppHsmService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("\${whatsapp.phone-number-id}")
    private String phoneNumberId;

    @Value("\${whatsapp.system-user-access-token}")
    private String accessToken;

    public void sendFollowUpTemplate(Contact contact, Deal deal) {
        String url = String.format("https://graph.facebook.com/v21.0/%s/messages", phoneNumberId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        // Monta o payload JSON estrito conforme exigido pela especificação da Meta
        Map<String, Object> payload = Map.of(
            "messaging_product", "whatsapp",
            "recipient_type", "individual",
            "to", contact.getWaId(),
            "type", "template",
            "template", Map.of(
                "name", "followup_proposta_comercial_24h",
                "language", Map.of("code", "pt_BR"),
                "components", List.of(
                    Map.of(
                        "type", "body",
                        "parameters", List.of(
                            Map.of("type", "text", "text", contact.getName()),
                            Map.of("type", "text", "text", deal.getTitle())
                        )
                    )
                )
            )
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            var response = restTemplate.postForEntity(url, request, String.class);
            log.info("Template HSM despachado com sucesso para {}. Status: {}",
                    contact.getWaId(), response.getStatusCode());
        } catch (Exception ex) {
            log.error("Falha ao despachar template HSM para Meta Graph API: {}", ex.getMessage());
        }
    }
}
`;
