from .models import Proposal, ProposalStatus


class ProposalStore:
    """Small in-memory store for the first vertical slice.

    Replace this boundary with DynamoDB or SQLite before production deployment.
    The API and approval semantics intentionally stay independent of persistence.
    """

    def __init__(self) -> None:
        self._proposals: dict[str, Proposal] = {}

    def add(self, proposal: Proposal) -> Proposal:
        self._proposals[proposal.id] = proposal
        return proposal

    def get(self, proposal_id: str) -> Proposal | None:
        return self._proposals.get(proposal_id)

    def list(self, status: ProposalStatus | None = None) -> list[Proposal]:
        proposals = list(self._proposals.values())
        if status is not None:
            proposals = [p for p in proposals if p.status == status]
        return sorted(proposals, key=lambda p: p.created_at, reverse=True)

    def decide(self, proposal_id: str, status: ProposalStatus) -> Proposal:
        proposal = self._proposals[proposal_id]
        proposal.status = status
        proposal.decided_at = proposal.created_at
        return proposal
