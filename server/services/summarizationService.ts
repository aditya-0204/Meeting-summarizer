import { GoogleGenAI, Type } from '@google/genai';
import { MeetingSummary, ActionItem, KeyDecision } from '../models/Meeting.js';
import { config } from '../config/env.js';

export class SummarizationService {
  private static getAiClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }

  /**
   * Generates intelligent, action-oriented meeting summary from transcript
   */
  public static async generateMeetingSummary(
    transcript: string,
    meetingTitle: string
  ): Promise<MeetingSummary> {
    const ai = this.getAiClient();

    const systemInstruction = `You are a Principal Technical Program Manager and Executive AI Analyst specializing in enterprise meeting intelligence.
Your responsibility is to analyze raw meeting transcripts with high fidelity and extract actionable insights.

CORE DIRECTIVES & ANTI-HALLUCINATION PROTOCOL:
1. EXECUTIVE SUMMARY: Write a concise, high-impact overview of the meeting purpose, outcomes, and business/technical direction (2-4 paragraphs).
2. KEY DISCUSSION POINTS: Extract the major topics and debates explored during the meeting.
3. KEY DECISIONS: Extract only clear agreements, architectural choices, policy shifts, or final consensus reached. Clearly distinguish finalized decisions from casual suggestions.
4. ACTION ITEMS:
   - Extract concrete, actionable tasks.
   - OWNER: Extract the explicitly assigned owner. If someone volunteered or was assigned by name, use that name. If the owner is ambiguous or not stated (e.g. "We need to check the DB logs"), set owner to null. DO NOT invent names.
   - DEADLINE: Extract the exact promised timeline if stated (e.g. "by EOD Friday", "before Sprint 4", "tomorrow morning"). If no deadline was mentioned, set deadline to null. DO NOT invent dates.
   - PRIORITY: Assign 'high', 'medium', or 'low' based on urgency discussed.
   - STATUS: Default to 'pending'.
5. RISKS & OPEN QUESTIONS: Highlight unresolved issues, blockers, or dependencies identified by attendees.`;

    const prompt = `MEETING TITLE: "${meetingTitle}"

TRANSCRIPT TO ANALYZE:
---
${transcript}
---

Extract structured meeting intelligence following the exact JSON schema. Ensure 100% adherence to the anti-hallucination protocol.`;

    const response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature for high factual consistency
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: {
              type: Type.STRING,
              description: 'Clear, concise executive summary of the meeting.'
            },
            keyDiscussionPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of main themes and topics debated during the meeting.'
            },
            keyDecisions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'Short unique string id like "dec-1"' },
                  decision: { type: Type.STRING, description: 'The finalized decision made.' },
                  context: { type: Type.STRING, description: 'Why this decision was made or trade-offs considered.' },
                  category: { type: Type.STRING, description: 'Domain category e.g. Architecture, Operations, Product, Budget.' }
                },
                required: ['decision', 'context']
              },
              description: 'Concrete decisions and consensus finalized in the meeting.'
            },
            actionItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'Short unique string id like "act-1"' },
                  task: { type: Type.STRING, description: 'Specific actionable task description.' },
                  owner: { type: Type.STRING, description: 'Name of the assigned person, or null/empty if unspecified.' },
                  deadline: { type: Type.STRING, description: 'Promised completion date/timeframe, or null/empty if unspecified.' },
                  priority: { type: Type.STRING, description: 'high, medium, or low' },
                  status: { type: Type.STRING, description: 'pending, in_progress, or completed' }
                },
                required: ['task']
              },
              description: 'Action items extracted from the transcript.'
            },
            risksAndOpenQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Unresolved questions, technical risks, or potential roadblocks.'
            }
          },
          required: [
            'executiveSummary',
            'keyDiscussionPoints',
            'keyDecisions',
            'actionItems',
            'risksAndOpenQuestions'
          ]
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error('LLM summarization returned empty output.');
    }

    const parsed = JSON.parse(outputText);

    // Sanitize and normalize action items
    const normalizedActionItems: ActionItem[] = (parsed.actionItems || []).map(
      (item: Record<string, unknown>, index: number) => {
        let owner = typeof item.owner === 'string' && item.owner.trim() ? item.owner.trim() : null;
        if (owner && (owner.toLowerCase() === 'null' || owner.toLowerCase() === 'unassigned' || owner.toLowerCase() === 'none' || owner.toLowerCase() === 'unknown')) {
          owner = null;
        }

        let deadline = typeof item.deadline === 'string' && item.deadline.trim() ? item.deadline.trim() : null;
        if (deadline && (deadline.toLowerCase() === 'null' || deadline.toLowerCase() === 'none' || deadline.toLowerCase() === 'unknown')) {
          deadline = null;
        }

        const priorityRaw = String(item.priority || 'medium').toLowerCase();
        const priority: 'low' | 'medium' | 'high' = ['low', 'medium', 'high'].includes(priorityRaw)
          ? (priorityRaw as 'low' | 'medium' | 'high')
          : 'medium';

        return {
          id: (typeof item.id === 'string' && item.id) ? item.id : `act-${index + 1}`,
          task: String(item.task || 'Unspecified task'),
          owner,
          deadline,
          priority,
          status: 'pending' as const
        };
      }
    );

    // Sanitize key decisions
    const normalizedDecisions: KeyDecision[] = (parsed.keyDecisions || []).map(
      (item: Record<string, unknown>, index: number) => ({
        id: (typeof item.id === 'string' && item.id) ? item.id : `dec-${index + 1}`,
        decision: String(item.decision || ''),
        context: String(item.context || ''),
        category: typeof item.category === 'string' ? item.category : 'General'
      })
    );

    return {
      executiveSummary: parsed.executiveSummary || 'No summary available.',
      keyDiscussionPoints: Array.isArray(parsed.keyDiscussionPoints) ? parsed.keyDiscussionPoints : [],
      keyDecisions: normalizedDecisions,
      actionItems: normalizedActionItems,
      risksAndOpenQuestions: Array.isArray(parsed.risksAndOpenQuestions) ? parsed.risksAndOpenQuestions : []
    };
  }
}
