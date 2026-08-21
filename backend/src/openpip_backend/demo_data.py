"""Sanitized fixture data for local demos and integration tests."""

from .models import BriefingRequest, Contact


def demo_request() -> BriefingRequest:
    return BriefingRequest(
        events=[
            {"id": "event-client-sync", "title": "Client project sync", "start": "09:30", "end": "10:00"},
            {"id": "event-focus", "title": "Focus block", "start": "10:30", "end": "12:00"},
        ],
        tasks=[
            {"id": "task-invoice", "title": "Review draft invoice", "due": "today"},
            {"id": "task-brief", "title": "Send project brief", "due": "tomorrow"},
        ],
        messages=[
            {"id": "message-client-followup", "subject": "Next steps for the project", "from": "client@example.test"},
            {"id": "message-newsletter", "subject": "Monthly product updates", "from": "updates@example.test"},
        ],
    )


def demo_contacts() -> list[Contact]:
    return [
        Contact(id="contact-client", name="Alex Morgan", email="client@example.test", last_interaction="Today", interaction_count=8, relationship_note="Active client project contact."),
        Contact(id="contact-partner", name="Sam Lee", email="partner@example.test", last_interaction="3 days ago", interaction_count=4, relationship_note="Professional collaborator."),
    ]
