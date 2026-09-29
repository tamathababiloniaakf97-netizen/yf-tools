import type { EvidenceRecord, ResearchHypothesis, ResearchProfile, ResearchSnapshotData } from '@/types/life-os';

export function buildResearchSnapshot(profile: ResearchProfile, hypotheses: ResearchHypothesis[], evidence: EvidenceRecord[]) {
  const snapshotData: ResearchSnapshotData = JSON.parse(JSON.stringify({ profile, hypotheses }));
  const evidenceSnapshot = evidence.map(({ id, content, impact, source_name, source_url, occurred_at, hypothesis_id }) => ({
    id, content, impact, source_name, source_url, occurred_at, hypothesis_id,
  }));
  return { snapshot_data: snapshotData, evidence_snapshot: JSON.parse(JSON.stringify(evidenceSnapshot)) };
}
