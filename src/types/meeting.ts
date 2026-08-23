export type ProcessingStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'TRANSCRIBING'
  | 'SUMMARIZING'
  | 'COMPLETED'
  | 'FAILED';

export type ActionItemStatus = 'pending' | 'in_progress' | 'completed';
export type ActionItemPriority = 'low' | 'medium' | 'high';

export interface ActionItem {
  id: string;
  task: string;
  owner: string | null;
  deadline: string | null;
  priority: ActionItemPriority;
  status: ActionItemStatus;
}

export interface KeyDecision {
  id: string;
  decision: string;
  context: string;
  category?: string;
}

export interface TranscriptSegment {
  speaker: string;
  timestamp?: string;
  text: string;
}

export interface MeetingSummary {
  executiveSummary: string;
  keyDiscussionPoints: string[];
  keyDecisions: KeyDecision[];
  actionItems: ActionItem[];
  risksAndOpenQuestions: string[];
}

export interface MeetingError {
  code: string;
  message: string;
  occurredAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  durationSeconds?: number;
  status: ProcessingStatus;
  progressPercent: number;
  currentStepMessage: string;
  transcript: string;
  transcriptSegments: TranscriptSegment[];
  summary: MeetingSummary | null;
  hasAudio: boolean;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  error?: MeetingError | null;
}

export interface WorkspaceStats {
  total: number;
  completed: number;
  processing: number;
  failed: number;
  totalActionItems: number;
  completedActionItems: number;
}
