"""Compatibility re-export of application settings.
Why: Preserves backward compatibility while moving the canonical settings into app.core.config.
"""
from app.core.config import Settings, get_settings

__all__ = ["Settings", "get_settings"]
