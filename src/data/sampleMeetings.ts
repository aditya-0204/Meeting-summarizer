export interface SampleMeeting {
  id: string;
  title: string;
  originalFileName: string;
  category: string;
  durationSeconds: number;
  description: string;
  transcript: string;
}

export const SAMPLE_MEETINGS: SampleMeeting[] = [
  {
    id: 'sample-eng-sync',
    title: 'Q3 Cloud Architecture & Database Migration Sync',
    originalFileName: 'cloud_arch_migration_sync_q3.mp3',
    category: 'Engineering & Architecture',
    durationSeconds: 320,
    description: 'Deep dive into database sharding, latency mitigation, and zero-downtime migration strategy.',
    transcript: `Alex: Good morning team. Thanks for hopping on. Today's agenda is finalizing our Q3 cloud database migration roadmap. Priya, could you lead us off with the current latency benchmarks on Postgres?

Priya: Sure Alex. In our staging stress tests, read latencies spiked to 450 milliseconds when simulating 20,000 concurrent sessions. The primary bottleneck is the unbounded user analytics table query. We ran an EXPLAIN ANALYZE, and we're seeing unindexed seq scans across 18 million rows.

Marcus: That matches what I observed in the telemetry logs. If we add a composite index on (tenant_id, created_at), we can bring the query cost down from 84,000 to under 400. I already tested this locally on a dump and p99 latency dropped to 18 milliseconds.

Alex: That's a huge improvement. Let's make a decision right now: we are going to enforce the composite index across all partition tables before we cut over. Marcus, can you prepare the schema migration script and verify it with the replica?

Marcus: Yes, I will draft the Flyway migration script and run the benchmark on staging by Thursday 5 PM.

Priya: What about the connection pool exhaustion under peak spikes? Right now PgBouncer is set to a max of 200 pool connections, but during flash sales we hit 500.

Alex: We decided last sprint to migrate PgBouncer to a distributed cluster mode behind an internal load balancer. Priya, please configure the distributed PgBouncer cluster in Terraform and open a PR by Friday afternoon.

Priya: Sounds good, I will have the Terraform configuration and health checks ready by Friday at 3 PM.

David: One risk we haven't discussed is data rollback. If the cutover fails on Sunday morning, what is our recovery SLA?

Alex: Great point David. Decision: We will maintain dual-write mode between the legacy instance and the new cluster for 48 hours post-migration. If error rate exceeds 0.5%, we trigger automatic fallback to legacy. David, can you write the dual-write verification test suite?

David: I'll write the dual-write integration test suite by end of day Monday.

Alex: Excellent. To summarize: Marcus owns the composite index migration script by Thursday, Priya handles the distributed PgBouncer PR by Friday, and David will finalize the dual-write verification suite by Monday. Let's reconvene Friday at 4 PM for the go/no-go review. Thanks all!`
  },
  {
    id: 'sample-product-launch',
    title: 'Mobile App 2.0 Go-To-Market & Feature Freeze Review',
    originalFileName: 'mobile_v2_launch_strategy.m4a',
    category: 'Product & Growth',
    durationSeconds: 240,
    description: 'Cross-functional review on onboarding UX, push notification permissions, and Apple App Store submission.',
    transcript: `Elena: Welcome everyone. We are 10 days out from our planned Mobile 2.0 release. Let's review the blockers and finalize our submission timeline. Carlos, where are we with the biometric authentication flow on iOS?

Carlos: The FaceID and TouchID integration is complete and passes all end-to-end tests. However, we found a bug on Android 14 where the biometric prompt fails to dismiss if the app is backgrounded. I need another day to fix the lifecycle listener.

Elena: Understood. Let's decide on the release criteria: We will not submit to Google Play until the Android biometric crash rate is strictly 0.0%. Carlos, when can you ship the fix?

Carlos: I will push the fix to the release candidate branch by tomorrow at 2 PM.

Maya: On the marketing and onboarding side, the A/B testing on the interactive walkthrough showed a 28% higher day-7 retention. We decided to make the 3-step carousel the default onboarding experience for all new signups.

Elena: Agreed, let's ship the 3-step carousel as default. Maya, please ensure all localized copy for Spanish and French is updated in Lokalise by Thursday.

Maya: Yes, I am coordinating with our localization agency and all translated assets will be merged by Thursday noon.

Carlos: Who is preparing the release notes and App Store screenshots for the compliance review?

Elena: Someone needs to assemble the final screenshot package with the new brand guidelines. We haven't formally assigned that yet, but it needs to be completed before submission next Tuesday.

Elena: Also, decision: we are setting the phased rollout to 10% on Day 1, 25% on Day 3, and 100% on Day 7 to monitor crash analytics safely. Let's execute on these items and meet tomorrow afternoon.`
  },
  {
    id: 'sample-security-audit',
    title: 'SOC2 Type II Compliance & Penetration Test Debrief',
    originalFileName: 'security_soc2_remediation_call.wav',
    category: 'Security & Compliance',
    durationSeconds: 280,
    description: 'Review of third-party penetration testing findings, secret rotation policies, and audit evidence collection.',
    transcript: `Vikram: Thanks for joining on short notice. We just received the final report from Cure53 on our external penetration test. Overall we scored strong, but there are two Medium vulnerabilities and one High severity finding we must remediate before the SOC2 audit window closes next month.

Rohan: Let's discuss the High finding first. It relates to session token invalidation upon password reset. Currently, existing JWT refresh tokens remain valid for up to 6 hours after a user changes their credentials.

Vikram: Right. Decision: We are implementing an immediate token revocation blacklist using distributed Redis with epoch timestamp versioning on all user accounts. Rohan, can you implement this revocation middleware?

Rohan: Yes, I will implement the JWT revocation blacklist and add unit tests. I will deploy it to staging by Wednesday EOD.

Amina: Regarding the Medium finding on CORS configuration: our staging environment had wildcard origins enabled for development endpoints. I already restricted the CORS policy to whitelist only our verified staging domains, and the pull request is ready.

Vikram: Great work Amina. Decision: All staging and development environments will inherit production CORS lockdown rules. Amina, please merge that PR today and enable strict Content Security Policy headers across all services.

Amina: I will merge the CORS PR and deploy CSP headers across all gateway endpoints by 6 PM today.

Rohan: What about the automated secret rotation for AWS IAM keys?

Vikram: We decided to enforce AWS Secrets Manager 90-day automatic rotation for all service accounts. We need someone from DevOps to configure the rotation Lambda functions before the auditor review in two weeks.

Vikram: Let's track these strictly: Rohan on JWT revocation by Wednesday EOD, Amina on CORS/CSP by 6 PM today, and we will follow up on the AWS secret rotation during sprint planning tomorrow.`
  }
];
