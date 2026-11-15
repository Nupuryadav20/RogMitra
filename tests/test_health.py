import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.main import read_root, health_check

def test_read_root():
    data = read_root()
    assert data["project"] == "RogMitra"
    assert data["status"] == "online"

def test_health_check():
    data = health_check()
    assert data["status"] == "healthy"
    assert data["project"] == "RogMitra"
    assert data["dataset_mts_dialog_present"] is True
    assert data["services"]["red_flags"] == "rule_based_ready"
