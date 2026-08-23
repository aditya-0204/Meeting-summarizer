import { GoogleGenAI, Type } from '@google/genai';
import { StorageService } from './storageService.js';
import { TranscriptSegment } from '../models/Meeting.js';
import { config } from '../config/env.js';

export interface TranscriptionResult {
  fullTranscript: string;
  segments: TranscriptSegment[];
}

export class TranscriptionService {
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
   * Transcribe an audio file using multimodal ASR
   */
  public static async transcribeAudio(
    audioFilePath: string,
    mimeType: string
  ): Promise<TranscriptionResult> {
    const ai = this.getAiClient();
    const base64Audio = await StorageService.getFileAsBase64(audioFilePath);
    const resolvedMime = StorageService.getMimeType(audioFilePath, mimeType);

    const prompt = `You are a high-precision Automatic Speech Recognition (ASR) engine for corporate and technical meetings.
Transcribe the provided audio accurately.
1. Capture every speaker's utterance verbatim.
2. Differentiate between speakers as "Speaker 1", "Speaker 2", etc., or use their spoken names if they introduce themselves or address each other.
3. Return the full raw transcript as well as an array of chronological segments.

Ensure high accuracy with technical terminology, project deadlines, decisions, and names.`;

    const response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: resolvedMime
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullTranscript: {
              type: Type.STRING,
              description: 'The complete verbatim transcript of the entire meeting audio.'
            },
            segments: {
              type: Type.ARRAY,
              description: 'Chronological list of speaker dialogue segments.',
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: {
                    type: Type.STRING,
                    description: 'Speaker identifier (e.g. "Rahul", "Sarah", "Speaker 1").'
                  },
                  timestamp: {
                    type: Type.STRING,
                    description: 'Approximate time offset or timestamp if identifiable.'
                  },
                  text: {
                    type: Type.STRING,
                    description: 'The spoken dialogue for this speaker turn.'
                  }
                },
                required: ['speaker', 'text']
              }
            }
          },
          required: ['fullTranscript', 'segments']
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error('ASR service returned an empty response.');
    }

    try {
      const parsed = JSON.parse(outputText) as TranscriptionResult;
      if (!parsed.fullTranscript || parsed.fullTranscript.trim().length === 0) {
        throw new Error('Transcription produced no text from the audio.');
      }
      return {
        fullTranscript: parsed.fullTranscript.trim(),
        segments: Array.isArray(parsed.segments) ? parsed.segments : []
      };
    } catch (parseErr) {
      console.warn('Failed to parse structured ASR output, creating fallback segments:', parseErr);
      return {
        fullTranscript: outputText.trim(),
        segments: [
          {
            speaker: 'Speaker',
            text: outputText.trim()
          }
        ]
      };
    }
  }
}
