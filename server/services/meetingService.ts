import { db } from '../config/database.js';
import { IMeeting, ActionItemStatus } from '../models/Meeting.js';
import { TranscriptionService } from './transcriptionService.js';
import { SummarizationService } from './summarizationService.js';
import { StorageService } from './storageService.js';
import { CloudinaryService } from './cloudinaryService.js';

export class MeetingService {
  /**
   * Initializes a new meeting record from an uploaded audio file
   * and fires the asynchronous processing pipeline in the background.
   */
  public static async createAndProcessMeeting(
    file: Express.Multer.File,
    title?: string
  ): Promise<IMeeting> {
    const id = `meet_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const sanitizedTitle = title && title.trim().length > 0
      ? title.trim()
      : file.originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    const newMeeting: IMeeting = {
      id,
      title: sanitizedTitle,
      originalFileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      status: 'UPLOADED',
      progressPercent: 5,
      currentStepMessage: 'Audio file uploaded and queued for processing',
      transcript: '',
      transcriptSegments: [],
      summary: null,
      audioStoragePath: file.path,
      hasAudio: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.create(newMeeting);

    const cloudinaryFile = await CloudinaryService.uploadVideo(file.path, id);
    if (cloudinaryFile) {
      newMeeting.cloudinaryUrl = cloudinaryFile.secureUrl;
      newMeeting.cloudinaryPublicId = cloudinaryFile.publicId;
      await db.update(id, {
        cloudinaryUrl: cloudinaryFile.secureUrl,
        cloudinaryPublicId: cloudinaryFile.publicId
      });
    }

    if (process.env.VERCEL === '1') {
      // Serverless functions can be stopped after the response is sent.
      await this.runProcessingPipeline(id, file.path, file.mimetype);
      return (await db.findById(id)) || newMeeting;
    }

    this.runProcessingPipeline(id, file.path, file.mimetype).catch((err) => {
      console.error(`Unhandled error in background pipeline for meeting ${id}:`, err);
    });

    return newMeeting;
  }

  /**
   * Loads a structured sample meeting recording or transcript for demonstration
   */
  public static async createSampleMeeting(sampleData: {
    title: string;
    originalFileName: string;
    transcript: string;
    fileSize?: number;
    durationSeconds?: number;
  }): Promise<IMeeting> {
    const id = `meet_sample_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const meeting: IMeeting = {
      id,
      title: sampleData.title,
      originalFileName: sampleData.originalFileName,
      fileType: 'audio/mp3',
      fileSize: sampleData.fileSize || 1024 * 512,
      durationSeconds: sampleData.durationSeconds || 180,
      status: 'TRANSCRIBING',
      progressPercent: 20,
      currentStepMessage: 'Transcribing sample audio session...',
      transcript: sampleData.transcript,
      transcriptSegments: this.formatTranscriptSegments(sampleData.transcript),
      summary: null,
      hasAudio: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.create(meeting);

    // Process summarization asynchronously
    setTimeout(async () => {
      try {
        await db.update(id, {
          status: 'SUMMARIZING',
          progressPercent: 60,
          currentStepMessage: 'Synthesizing key decisions & action items with LLM...'
        });

        const summary = await SummarizationService.generateMeetingSummary(
          sampleData.transcript,
          sampleData.title
        );

        await db.update(id, {
          status: 'COMPLETED',
          progressPercent: 100,
          currentStepMessage: 'Meeting intelligence processing completed successfully.',
          summary,
          processedAt: new Date().toISOString()
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Summarization error';
        await db.update(id, {
          status: 'FAILED',
          progressPercent: 100,
          currentStepMessage: 'Processing failed during summarization.',
          error: {
            code: 'SAMPLE_PROCESSING_FAILED',
            message: errorMsg,
            occurredAt: new Date().toISOString()
          }
        });
      }
    }, 400);

    return meeting;
  }

  /**
   * The core multi-step asynchronous processing pipeline
   */
  private static async runProcessingPipeline(
    meetingId: string,
    audioFilePath: string,
    mimeType: string
  ): Promise<void> {
    try {
      // Step 1: Transcription / ASR
      await db.update(meetingId, {
        status: 'TRANSCRIBING',
        progressPercent: 25,
        currentStepMessage: 'Transcribing audio using Speech-to-Text ASR model...'
      });

      const transcriptionResult = await TranscriptionService.transcribeAudio(
        audioFilePath,
        mimeType
      );

      await db.update(meetingId, {
        transcript: transcriptionResult.fullTranscript,
        transcriptSegments: transcriptionResult.segments,
        progressPercent: 55,
        currentStepMessage: 'Transcript generated. Analyzing meeting intelligence...'
      });

      // Step 2: Summarization & Action Item Extraction
      const meeting = await db.findById(meetingId);
      const title = meeting?.title || 'Meeting';

      await db.update(meetingId, {
        status: 'SUMMARIZING',
        progressPercent: 75,
        currentStepMessage: 'Extracting executive summary, key decisions, and action items...'
      });

      const summary = await SummarizationService.generateMeetingSummary(
        transcriptionResult.fullTranscript,
        title
      );

      // Step 3: Completion
      await db.update(meetingId, {
        status: 'COMPLETED',
        progressPercent: 100,
        currentStepMessage: 'Processing completed successfully.',
        summary,
        processedAt: new Date().toISOString()
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown processing error';
      console.error(`Pipeline failure for meeting ${meetingId}:`, err);

      await db.update(meetingId, {
        status: 'FAILED',
        progressPercent: 100,
        currentStepMessage: `Failed: ${errorMsg}`,
        error: {
          code: 'PROCESSING_PIPELINE_ERROR',
          message: errorMsg,
          occurredAt: new Date().toISOString()
        }
      });
    }
  }

  public static async getMeeting(id: string): Promise<IMeeting | null> {
    return db.findById(id);
  }

  public static async getAllMeetings(options?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ meetings: IMeeting[]; total: number }> {
    return db.findAll(options);
  }

  public static async updateActionItem(
    meetingId: string,
    actionItemId: string,
    status: ActionItemStatus,
    owner?: string | null
  ): Promise<IMeeting | null> {
    return db.updateActionItemStatus(meetingId, actionItemId, status, owner);
  }

  public static async deleteMeeting(id: string): Promise<boolean> {
    const meeting = await db.findById(id);
    if (!meeting) return false;

    if (meeting.audioStoragePath) {
      await StorageService.deleteFile(meeting.audioStoragePath);
    }
    await CloudinaryService.deleteVideo(meeting.cloudinaryPublicId);

    return db.delete(id);
  }

  public static async reprocessMeeting(id: string): Promise<IMeeting | null> {
    const meeting = await db.findById(id);
    if (!meeting) return null;

    if (meeting.audioStoragePath && StorageService.fileExists(meeting.audioStoragePath)) {
      await db.update(id, {
        status: 'PROCESSING',
        progressPercent: 10,
        currentStepMessage: 'Reprocessing audio...',
        error: null
      });

      this.runProcessingPipeline(id, meeting.audioStoragePath, meeting.fileType).catch(console.error);
    } else if (meeting.transcript && meeting.transcript.length > 0) {
      // Reprocess summary only from existing transcript
      await db.update(id, {
        status: 'SUMMARIZING',
        progressPercent: 50,
        currentStepMessage: 'Re-extracting summary and action items from transcript...',
        error: null
      });

      SummarizationService.generateMeetingSummary(meeting.transcript, meeting.title)
        .then(async (summary) => {
          await db.update(id, {
            status: 'COMPLETED',
            progressPercent: 100,
            currentStepMessage: 'Reprocessing completed.',
            summary,
            processedAt: new Date().toISOString()
          });
        })
        .catch(async (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Reprocessing failed';
          await db.update(id, {
            status: 'FAILED',
            error: {
              code: 'REPROCESS_FAILED',
              message,
              occurredAt: new Date().toISOString()
            }
          });
        });
    } else {
      throw new Error('Cannot reprocess meeting without audio file or transcript.');
    }

    return db.findById(id);
  }

  public static async getMetrics() {
    return db.getStats();
  }

  private static formatTranscriptSegments(rawText: string) {
    const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
    return lines.map((line) => {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        return {
          speaker: match[1].trim(),
          text: match[2].trim()
        };
      }
      return {
        speaker: 'Speaker',
        text: line.trim()
      };
    });
  }
}
