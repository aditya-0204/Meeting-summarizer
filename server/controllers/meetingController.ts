import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { MeetingService } from '../services/meetingService.js';
import { MeetingValidator } from '../validators/meetingValidator.js';
import { ActionItemStatus } from '../models/Meeting.js';
import { StorageService } from '../services/storageService.js';

export class MeetingController {
  /**
   * POST /api/meetings/upload
   * Accepts audio file upload & starts async transcription/summarization
   */
  public static async uploadMeeting(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validation = MeetingValidator.validateAudioFile(req.file);
      if (!validation.isValid) {
        res.status(validation.statusCode || 400).json({
          success: false,
          message: validation.error || 'Invalid audio file.'
        });
        return;
      }

      const file = req.file!;
      const title = MeetingValidator.validateMeetingTitle(req.body.title);

      const meeting = await MeetingService.createAndProcessMeeting(file, title);

      res.status(201).json({
        success: true,
        message: 'Meeting audio uploaded successfully. Processing started in the background.',
        data: {
          meetingId: meeting.id,
          meeting
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/meetings/sample
   * Loads a curated sample meeting for rapid testing/demonstration
   */
  public static async loadSampleMeeting(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { title, originalFileName, transcript, durationSeconds } = req.body;
      if (!transcript || typeof transcript !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Sample meeting requires a valid transcript string.'
        });
        return;
      }

      const sampleTitle = title || 'Engineering Architecture Review';
      const sampleFileName = originalFileName || 'engineering-architecture-review.mp3';

      const meeting = await MeetingService.createSampleMeeting({
        title: sampleTitle,
        originalFileName: sampleFileName,
        transcript,
        durationSeconds: durationSeconds || 240
      });

      res.status(201).json({
        success: true,
        message: 'Sample meeting loaded successfully and processing queued.',
        data: {
          meetingId: meeting.id,
          meeting
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/meetings
   * Lists all meetings with status, progress, and pagination
   */
  public static async getAllMeetings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await MeetingService.getAllMeetings({ status, search, limit, offset });
      const stats = await MeetingService.getMetrics();

      res.status(200).json({
        success: true,
        message: 'Meetings retrieved successfully.',
        data: {
          meetings: result.meetings,
          total: result.total,
          stats
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/meetings/:id
   * Returns complete meeting intelligence including transcript, summary, and action items
   */
  public static async getMeetingById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const meeting = await MeetingService.getMeeting(id);

      if (!meeting) {
        res.status(404).json({
          success: false,
          message: `Meeting with ID "${id}" was not found.`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          meeting
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/meetings/:id/action-items/:itemId
   * Updates status or owner of a specific extracted action item
   */
  public static async updateActionItem(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id, itemId } = req.params;
      const { status, owner } = req.body;

      const validation = MeetingValidator.validateActionItemUpdate(status, owner);
      if (!validation.isValid) {
        res.status(validation.statusCode || 400).json({
          success: false,
          message: validation.error
        });
        return;
      }

      const updatedMeeting = await MeetingService.updateActionItem(
        id,
        itemId,
        status as ActionItemStatus,
        owner
      );

      if (!updatedMeeting) {
        res.status(404).json({
          success: false,
          message: 'Meeting or Action Item not found.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Action item updated successfully.',
        data: {
          meeting: updatedMeeting
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/meetings/:id
   * Deletes meeting record and cleans up audio storage
   */
  public static async deleteMeeting(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await MeetingService.deleteMeeting(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: `Meeting with ID "${id}" was not found.`
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Meeting deleted successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/meetings/:id/reprocess
   * Triggers re-running the intelligence extraction pipeline
   */
  public static async reprocessMeeting(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const reprocessed = await MeetingService.reprocessMeeting(id);

      if (!reprocessed) {
        res.status(404).json({
          success: false,
          message: `Meeting with ID "${id}" was not found.`
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Meeting reprocessing initiated.',
        data: {
          meeting: reprocessed
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/meetings/:id/audio
   * Streams audio file for in-browser playback
   */
  public static async streamAudio(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const meeting = await MeetingService.getMeeting(id);

      if (!meeting || !meeting.audioStoragePath || !StorageService.fileExists(meeting.audioStoragePath)) {
        if (meeting?.cloudinaryUrl) {
          res.redirect(meeting.cloudinaryUrl);
          return;
        }
        res.status(404).json({
          success: false,
          message: 'Audio recording not found for this meeting.'
        });
        return;
      }

      if (meeting.cloudinaryUrl) {
        res.redirect(meeting.cloudinaryUrl);
        return;
      }

      const filePath = meeting.audioStoragePath;
      const stat = fs.statSync(filePath);
      const total = stat.size;
      const mime = meeting.fileType || StorageService.getMimeType(filePath);

      // Support HTTP 206 partial range streaming for seekable audio players
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const partialstart = parts[0];
        const partialend = parts[1];

        const start = parseInt(partialstart, 10);
        const end = partialend ? parseInt(partialend, 10) : total - 1;
        const chunksize = end - start + 1;

        const file = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${total}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': mime
        });
        file.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': total,
          'Content-Type': mime
        });
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/metrics
   * Provides aggregate workspace health and meeting analytics
   */
  public static async getMetrics(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await MeetingService.getMetrics();
      res.status(200).json({
        success: true,
        data: { stats }
      });
    } catch (err) {
      next(err);
    }
  }
}
