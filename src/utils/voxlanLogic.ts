export interface VoxlanCandidate {
  id: string;
  name: string;
  manifesto: string;
  house: string;
  votes: number;
  accent: string;
}

export interface VoxlanElectionState {
  electionTitle: string;
  registeredVoterIds: string[];
  votedIds: string[];
  candidates: VoxlanCandidate[];
  networkMode: 'LOCAL_LAN_OFFLINE';
}

export interface VoteResult {
  ok: boolean;
  error?: string;
  nextState: VoxlanElectionState;
}

export function createInitialVoxlanState(): VoxlanElectionState {
  return {
    electionTitle: 'Head Prefect Council · Local Polling Booth Demo',
    registeredVoterIds: [
      'UG-SCH-001',
      'UG-SCH-042',
      'UG-SCH-089',
      'UG-SCH-104',
      'UG-SCH-118',
    ],
    votedIds: ['UG-SCH-001', 'UG-SCH-089'],
    candidates: [
      {
        id: 'cand-a',
        name: 'Candidate Slot A',
        manifesto: 'Academic digital library access & science lab tooling',
        house: 'Victoria House',
        votes: 48,
        accent: '#4C138E',
      },
      {
        id: 'cand-b',
        name: 'Candidate Slot B',
        manifesto: 'Campus sustainability, sports logistics & student council transparency',
        house: 'Rwenzori House',
        votes: 39,
        accent: '#F5B800',
      },
      {
        id: 'cand-c',
        name: 'Candidate Slot C',
        manifesto: 'Peer Python & Web Development coding study clubs across houses',
        house: 'Nile House',
        votes: 31,
        accent: '#8D5B38',
      },
    ],
    networkMode: 'LOCAL_LAN_OFFLINE',
  };
}

export function normalizeVoterId(rawId: string): string {
  return rawId.trim().toUpperCase();
}

export function verifyVoterId(
  state: VoxlanElectionState,
  rawVoterId: string,
): { valid: boolean; reason?: string; normalizedId: string } {
  const normalizedId = normalizeVoterId(rawVoterId);
  if (!normalizedId) {
    return { valid: false, reason: 'Enter a voter ID (e.g. UG-SCH-042).', normalizedId };
  }
  if (!state.registeredVoterIds.includes(normalizedId)) {
    return {
      valid: false,
      reason: `Voter ID "${normalizedId}" is not on the local booth roll. Try UG-SCH-042, UG-SCH-104, or UG-SCH-118.`,
      normalizedId,
    };
  }
  if (state.votedIds.includes(normalizedId)) {
    return {
      valid: false,
      reason: `Voter ID "${normalizedId}" has already cast an offline ballot.`,
      normalizedId,
    };
  }
  return { valid: true, normalizedId };
}

export function castVoxlanBallot(
  state: VoxlanElectionState,
  rawVoterId: string,
  candidateId: string,
): VoteResult {
  const check = verifyVoterId(state, rawVoterId);
  if (!check.valid) {
    return {
      ok: false,
      error: check.reason,
      nextState: state,
    };
  }

  const candidateExists = state.candidates.some((c) => c.id === candidateId);
  if (!candidateExists) {
    return {
      ok: false,
      error: 'Select a candidate before submitting your ballot.',
      nextState: state,
    };
  }

  const nextState: VoxlanElectionState = {
    ...state,
    votedIds: [...state.votedIds, check.normalizedId],
    candidates: state.candidates.map((c) =>
      c.id === candidateId ? { ...c, votes: c.votes + 1 } : c,
    ),
  };

  return { ok: true, nextState };
}

export function computeVoxlanAnalytics(state: VoxlanElectionState) {
  const totalVotes = state.candidates.reduce((sum, c) => sum + c.votes, 0);
  const leading = [...state.candidates].sort((a, b) => b.votes - a.votes)[0] ?? null;
  const breakdown = state.candidates.map((c) => ({
    ...c,
    sharePct: totalVotes > 0 ? Math.round((c.votes / totalVotes) * 1000) / 10 : 0,
  }));

  return {
    totalVotes,
    leadingCandidateId: leading?.id ?? null,
    demoRollCount: state.registeredVoterIds.length,
    demoVotedCount: state.votedIds.length,
    breakdown,
  };
}
