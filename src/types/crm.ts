export type UserRole = 'ADMIN' | 'MANAGER' | 'AGENT';
export type Department = 'SALES' | 'SUPPORT' | 'FINANCE' | 'GENERAL';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department;
  avatarUrl: string;
  isActive: boolean;
  isOnline: boolean;
  maxConcurrentChats: number;
  currentActiveChats: number;
}

export type OptInStatus = 'OPTED_IN' | 'OPTED_OUT' | 'PENDING';

export interface Contact {
  id: string;
  waId: string; // e.g. 5511987654321
  name: string;
  email?: string;
  company?: string;
  profilePicUrl?: string;
  customFields: Record<string, string | number | boolean>;
  tags: string[];
  optInStatus: OptInStatus;
  optInTimestamp: string;
  optInSource: string;
  createdAt: string;
}

export type TicketStatus = 'BOT' | 'QUEUED' | 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Ticket {
  id: string;
  protocolNumber: string;
  contactId: string;
  assignedUserId: string | null;
  department: Department;
  status: TicketStatus;
  priority: TicketPriority;
  lastMessagePreview?: string;
  unreadCount: number;
  lastInteractionAt: string;
  createdAt: string;
  closedAt?: string;
}

export type SenderType = 'CONTACT' | 'AGENT' | 'BOT' | 'SYSTEM';
export type MessageType = 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'TEMPLATE_HSM' | 'INTERACTIVE';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface Message {
  id: string;
  ticketId: string;
  contactId: string;
  senderType: SenderType;
  senderName?: string;
  waMessageId?: string;
  messageType: MessageType;
  content: string;
  mediaUrl?: string;
  templateName?: string;
  status: MessageStatus;
  isInternalNote?: boolean;
  createdAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  orderIndex: number;
  color: string;
}

export type DealStatus = 'OPEN' | 'WON' | 'LOST';

export interface Deal {
  id: string;
  title: string;
  contactId: string;
  pipelineStageId: string;
  assignedUserId: string;
  value: number; // In BRL
  probability: number;
  expectedCloseDate: string;
  lastStageMovedAt: string;
  lastSellerActivityAt: string; // For 24h follow-up alerts
  status: DealStatus;
  tags: string[];
  createdAt: string;
}

export interface ConsentLog {
  id: string;
  contactId: string;
  waId: string;
  consentType: 'WHATSAPP_OPT_IN' | 'MARKETING' | 'DATA_PROCESSING';
  action: 'GRANTED' | 'REVOKED';
  ipAddress: string;
  legalBasis: string;
  payloadHash: string;
  createdAt: string;
}

export interface WebhookEventLog {
  id: string;
  timestamp: string;
  type: 'WEBHOOK_RECEIVED' | 'SIGNATURE_VERIFIED' | 'ROUTING_ROUND_ROBIN' | 'BOT_INTERACTION' | 'WEBSOCKET_PUSH' | 'HSM_DISPATCHED';
  payloadSummary: string;
  status: 'SUCCESS' | 'WARN' | 'ERROR';
  details?: Record<string, any>;
}
