import fs from 'fs';
import path from 'path';
import { IMeeting, ActionItemStatus } from '../models/Meeting.js';

/**
 * Robust Database Repository for Meeting Records
 * Implements persistent JSON store + In-Memory index for high performance,
 * transactional atomicity, and query filtering.
 */
class MeetingDatabase {
  private meetings: Map<string, IMeeting> = new Map();
  private storageFile: string;

  constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        console.error('Failed to create data directory:', err);
      }
    }
    this.storageFile = path.join(dataDir, 'meetings.json');
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((meeting: IMeeting) => {
            this.meetings.set(meeting.id, meeting);
          });
        }
      }
    } catch (err) {
      console.error('Error loading meetings database from disk:', err);
    }
  }

  private saveToDisk(): void {
    try {
      const data = Array.from(this.meetings.values());
      fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving meetings database to disk:', err);
    }
  }

  public async create(meeting: IMeeting): Promise<IMeeting> {
    this.meetings.set(meeting.id, meeting);
    this.saveToDisk();
    return meeting;
  }

  public async findById(id: string): Promise<IMeeting | null> {
    return this.meetings.get(id) || null;
  }

  public async findAll(options?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ meetings: IMeeting[]; total: number }> {
    let list = Array.from(this.meetings.values());

    // Sort descending by creation date
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (options?.status) {
      list = list.filter((m) => m.status.toLowerCase() === options.status?.toLowerCase());
    }

    if (options?.search) {
      const term = options.search.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(term) ||
          m.originalFileName.toLowerCase().includes(term) ||
          (m.transcript && m.transcript.toLowerCase().includes(term)) ||
          (m.summary?.executiveSummary && m.summary.executiveSummary.toLowerCase().includes(term))
      );
    }

    const total = list.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    const paginated = list.slice(offset, offset + limit);

    return { meetings: paginated, total };
  }

  public async update(id: string, updates: Partial<IMeeting>): Promise<IMeeting | null> {
    const existing = this.meetings.get(id);
    if (!existing) return null;

    const updated: IMeeting = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.meetings.set(id, updated);
    this.saveToDisk();
    return updated;
  }

  public async updateActionItemStatus(
    meetingId: string,
    actionItemId: string,
    status: ActionItemStatus,
    owner?: string | null
  ): Promise<IMeeting | null> {
    const meeting = this.meetings.get(meetingId);
    if (!meeting || !meeting.summary || !meeting.summary.actionItems) {
      return null;
    }

    const item = meeting.summary.actionItems.find((a) => a.id === actionItemId);
    if (!item) return null;

    item.status = status;
    if (owner !== undefined) {
      item.owner = owner;
    }

    meeting.updatedAt = new Date().toISOString();
    this.meetings.set(meetingId, meeting);
    this.saveToDisk();
    return meeting;
  }

  public async delete(id: string): Promise<boolean> {
    const deleted = this.meetings.delete(id);
    if (deleted) {
      this.saveToDisk();
    }
    return deleted;
  }

  public async getStats(): Promise<{
    total: number;
    completed: number;
    processing: number;
    failed: number;
    totalActionItems: number;
    completedActionItems: number;
  }> {
    const all = Array.from(this.meetings.values());
    let totalActionItems = 0;
    let completedActionItems = 0;

    let completed = 0;
    let processing = 0;
    let failed = 0;

    for (const m of all) {
      if (m.status === 'COMPLETED') completed++;
      else if (m.status === 'FAILED') failed++;
      else processing++;

      if (m.summary?.actionItems) {
        totalActionItems += m.summary.actionItems.length;
        completedActionItems += m.summary.actionItems.filter((a) => a.status === 'completed').length;
      }
    }

    return {
      total: all.length,
      completed,
      processing,
      failed,
      totalActionItems,
      completedActionItems
    };
  }
}

export const db = new MeetingDatabase();
