# backend/app/services/asr/whisper_service.py
# ASR Service: faster-whisper model wrapper with browser Web Speech API fallback
import os
import shutil
from typing import Dict, Any, Optional

class WhisperService:
    def __init__(self):
        self.model = None
        self.ffmpeg_available = shutil.which("ffmpeg") is not None
        self.model_loaded = False

    def check_prerequisites(self) -> Dict[str, Any]:
        """
        Checks local machine prerequisites for server-side Whisper.
        """
        has_ffmpeg = shutil.which("ffmpeg") is not None
        try:
            import faster_whisper
            has_package = True
        except ImportError:
            has_package = False

        return {
            "ffmpeg_installed": has_ffmpeg,
            "faster_whisper_installed": has_package,
            "recommended_fallback": "Web Speech API (Browser native speech recognition)",
            "supported_languages": ["Hindi (hi)", "English (en)"]
        }

    def transcribe_audio_file(self, file_path: str, language: str = "en") -> Dict[str, Any]:
        """
        Transcribes audio file using faster-whisper if available;
        otherwise returns an honest diagnostic fallback.
        """
        prereqs = self.check_prerequisites()
        if not prereqs["ffmpeg_installed"] or not prereqs["faster_whisper_installed"]:
            return {
                "success": False,
                "transcript": None,
                "error": "Server-side faster-whisper requires ffmpeg and faster_whisper package.",
                "fallback_active": True,
                "fallback_service": "Browser Web Speech API",
                "instructions": "Use browser native SpeechRecognition in client UI."
            }

        # If available, run inference
        try:
            from faster_whisper import WhisperModel
            if not self.model:
                self.model = WhisperModel("base", device="cpu", compute_type="int8")
            segments, info = self.model.transcribe(file_path, language=language)
            text = " ".join([seg.text for seg in segments])
            return {
                "success": True,
                "transcript": text.strip(),
                "detected_language": info.language,
                "fallback_active": False
            }
        except Exception as e:
            return {
                "success": False,
                "transcript": None,
                "error": str(e),
                "fallback_active": True
            }

whisper_service = WhisperService()
