import { Router } from 'express';
import { MeetingController } from '../controllers/meetingController.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

// Meeting Upload & Sample Seeding
router.post('/upload', upload.single('audio'), MeetingController.uploadMeeting);
router.post('/sample', MeetingController.loadSampleMeeting);

// Meeting Collection & Metrics
router.get('/', MeetingController.getAllMeetings);
router.get('/metrics', MeetingController.getMetrics);

// Individual Meeting Operations
router.get('/:id', MeetingController.getMeetingById);
router.delete('/:id', MeetingController.deleteMeeting);
router.post('/:id/reprocess', MeetingController.reprocessMeeting);
router.get('/:id/audio', MeetingController.streamAudio);

// Action Item Management
router.patch('/:id/action-items/:itemId', MeetingController.updateActionItem);

export default router;
