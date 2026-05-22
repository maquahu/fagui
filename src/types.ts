/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WorkspaceType = 'case_analysis' | 'draft' | 'report' | 'general';

export interface Attachment {
  id: string;
  name: string;
  size: string;
  mime: string;
  uploadedAt: string;
  extractedText?: string;
}

export interface Artifact {
  id: string;
  type: 'analysis' | 'document' | 'report';
  title: string;
  summary: string;
  content: string;
  createdAt: string;
  meta?: {
    winRate?: number;
    payoutRisk?: string;
    mediationProspect?: string;
    templateId?: string;
    templateName?: string;
    factSummary?: string;
    keyDisputes?: string[];
    litigationStrategies?: string[];
    timelineEvents?: { date: string; event: string; docName?: string }[];
    question?: string;
    analysisMarkdown?: string;
  };
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  type: WorkspaceType;
  isApiCreated: boolean;
  caseNo: string;
  opposingParty: string;
  amount: number;
  status: 'underway' | 'closed';
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
  artifacts: Artifact[];
}

export interface Template {
  id: string;
  name: string;
  fileName: string;
  createdAt: string;
  uploadedBy: string;
  tags: string[];
  content: string;
  isSystem?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    type: 'create_workspace' | 'go_analyze' | 'go_draft' | 'go_report';
    payload?: any;
  };
  attachments?: Attachment[];
}

export interface QaRecord {
  id: string;
  question: string;
  answer: string;
  useCaseData: boolean;
  useStatuteData: boolean;
  attachments: { name: string; size: string }[];
  createdAt: string;
}

