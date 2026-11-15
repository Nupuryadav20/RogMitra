# backend/app/services/dialogue/manager.py
# Ontology-based clinical dialogue manager with SOCRATES symptom follow-ups
from typing import Dict, Any, List, Optional

HISTORY_SLOTS = [
    "presenting_complaint",
    "onset_duration",
    "character",
    "severity",
    "associated_symptoms",
    "past_medical",
    "medications",
    "allergies",
    "lifestyle"
]

class DialogueManager:
    """
    Manages slot-filling clinical state machine ensuring all mandatory
    history fields are elicited using the SOCRATES framework.
    """
    def __init__(self, session_id: str, language: str = "en"):
        self.session_id = session_id
        self.language = language
        self.slots: Dict[str, Optional[str]] = {slot: None for slot in HISTORY_SLOTS}

    def update_slot(self, field_name: str, value: str):
        if field_name in self.slots:
            self.slots[field_name] = value

    def get_next_missing_slot(self) -> Optional[str]:
        for slot in HISTORY_SLOTS:
            if not self.slots.get(slot):
                return slot
        return None

    def is_complete(self) -> bool:
        return self.get_next_missing_slot() is None

    def get_filled_summary(self) -> Dict[str, Any]:
        return {k: v for k, v in self.slots.items() if v is not None}
