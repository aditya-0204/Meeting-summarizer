import { MeetingValidator } from '../validators/meetingValidator.js';
import { db } from '../config/database.js';
import { IMeeting } from '../models/Meeting.js';

/**
 * Backend Unit & Integration Tests
 * Runs assertions against Validators, Data Store, and Models
 */
async function runBackendTests() {
  console.log('🧪 Starting Backend Test Suite...');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: Audio file validation - empty file
  const emptyValidation = MeetingValidator.validateAudioFile(undefined);
  assert(!emptyValidation.isValid && emptyValidation.statusCode === 400, 'Rejects undefined file with 400');

  // TEST 2: Meeting title sanitizer
  const sanitizedTitle = MeetingValidator.validateMeetingTitle('   Sprint Architecture Review   ');
  assert(sanitizedTitle === 'Sprint Architecture Review', 'Trims whitespace from meeting titles');

  // TEST 3: Action Item status validator
  const invalidStatus = MeetingValidator.validateActionItemUpdate('invalid_status');
  assert(!invalidStatus.isValid, 'Rejects illegal action item status');

  const validStatus = MeetingValidator.validateActionItemUpdate('completed', 'Rahul');
  assert(validStatus.isValid, 'Accepts valid status and assignee');

  // TEST 4: Database Repository CRUD
  const testMeeting: IMeeting = {
    id: `test_${Date.now()}`,
    title: 'Unit Test Meeting',
    originalFileName: 'unit_test.mp3',
    fileType: 'audio/mp3',
    fileSize: 1024,
    status: 'COMPLETED',
    progressPercent: 100,
    currentStepMessage: 'Done',
    transcript: 'Alex: We should ship this on Friday.\nRahul: I will deploy the build.',
    transcriptSegments: [
      { speaker: 'Alex', text: 'We should ship this on Friday.' },
      { speaker: 'Rahul', text: 'I will deploy the build.' }
    ],
    summary: {
      executiveSummary: 'Ship on Friday discussion.',
      keyDiscussionPoints: ['Deployment schedule'],
      keyDecisions: [{ id: 'dec-1', decision: 'Ship on Friday', context: 'Sprint end' }],
      actionItems: [{ id: 'act-1', task: 'Deploy the build', owner: 'Rahul', deadline: 'Friday', priority: 'high', status: 'pending' }],
      risksAndOpenQuestions: []
    },
    hasAudio: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.create(testMeeting);
  const fetched = await db.findById(testMeeting.id);
  assert(fetched !== null && fetched.title === 'Unit Test Meeting', 'Creates and retrieves meeting from DB repository');

  // TEST 5: Action Item status update
  await db.updateActionItemStatus(testMeeting.id, 'act-1', 'completed', 'Rahul S.');
  const updatedMeeting = await db.findById(testMeeting.id);
  const updatedAction = updatedMeeting?.summary?.actionItems.find((a) => a.id === 'act-1');
  assert(updatedAction?.status === 'completed' && updatedAction?.owner === 'Rahul S.', 'Mutates action item status and owner');

  // TEST 6: Delete
  await db.delete(testMeeting.id);
  const deletedCheck = await db.findById(testMeeting.id);
  assert(deletedCheck === null, 'Deletes meeting from repository');

  console.log(`\n📊 Backend Test Results: ${passed} Passed, ${failed} Failed`);
}

// Allow standalone execution
if (process.argv[1] && process.argv[1].includes('meeting.test')) {
  runBackendTests().catch(console.error);
}

export { runBackendTests };
