"""
DarkLens V0.2 — Evaluation Harness Scaffold

Defines benchmark ground truth and scoring logic for precision, recall, F1, and false-positive rate across the benchmark/ directory (positive / negative / ambiguous / adversarial). End-to-end benchmark results are pending until the extension-driven evaluation harness is running.

HOW TO RUN (not executed in this delivery — requires a local Chrome install
and the unpacked extension, per Chrome's extension-testing model):

    pip install playwright
    playwright install chromium
    python evals/score.py

This script uses Playwright's persistent-context + --load-extension pattern,
which is the standard way to drive a real MV3 extension end-to-end (Chrome
extensions cannot be exercised in a plain headless page load — they require
an actual extension-aware browser context).

Ground truth is defined BEFORE the detector is built (see docs/README.md,
"define ground truth before you build the detector") in ground_truth.json,
one entry per benchmark file, listing which patternIds SHOULD fire and which
should NOT (for negative/adversarial-false-negative cases).
"""

import json
import subprocess
import sys
from pathlib import Path

BENCHMARK_DIR = Path(__file__).parent.parent / "benchmark"
RESULTS_DIR = Path(__file__).parent / "results"
GROUND_TRUTH_FILE = Path(__file__).parent / "ground_truth.json"

# Ground truth: what SHOULD be found in each synthetic benchmark file.
# Written before any detection logic ran against these files.
GROUND_TRUTH = {
    "benchmark/positive/case1.html": {
        "expected_patterns": [
            "CCPA-2023-CONFIRM-SHAMING",
            "CCPA-2023-BASKET-SNEAKING-ADJACENT",
            "CCPA-2023-INTERFACE-INTERFERENCE",
        ]
    },
    "benchmark/negative/case1.html": {"expected_patterns": []},
    "benchmark/ambiguous/case1.html": {
        "expected_patterns": ["CCPA-2023-BASKET-SNEAKING-ADJACENT"],
        "expected_tier": 3,
    },
    "benchmark/adversarial/confirmshame-paraphrase.html": {
        # Intentionally expected to evade V0.2 — planned false-negative stress case,
        # not a bug. See docs/RED-TEAM.md #2. Do not publish performance claims from this file alone.
        "expected_patterns": [],
        "known_false_negative": True,
    },
    "benchmark/adversarial/overflow-clip.html": {
        "expected_patterns": ["CCPA-2023-INTERFACE-INTERFERENCE"],
        "known_ui_limitation": "outline may be visually clipped; finding must still be logged",
    },
}


def write_ground_truth():
    GROUND_TRUTH_FILE.write_text(json.dumps(GROUND_TRUTH, indent=2))
    print(f"Ground truth written to {GROUND_TRUTH_FILE}")


def score_run(actual_results: dict) -> dict:
    """
    actual_results: { file_path: [patternId, patternId, ...] } as reported by
    the extension for that page (collect this by driving the extension with
    Playwright and reading chrome.runtime messages / side panel state).
    """
    tp = fp = fn = 0
    for file_path, gt in GROUND_TRUTH.items():
        expected = set(gt["expected_patterns"])
        actual = set(actual_results.get(file_path, []))
        tp += len(expected & actual)
        fp += len(actual - expected)
        fn += len(expected - actual)

    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0

    return {
        "true_positives": tp,
        "false_positives": fp,
        "false_negatives": fn,
        "precision": round(precision, 3),
        "recall": round(recall, 3),
        "f1": round(f1, 3),
    }


if __name__ == "__main__":
    RESULTS_DIR.mkdir(exist_ok=True)
    write_ground_truth()
    print(
        "\nThis script defines ground truth and scoring logic only.\n"
        "End-to-end benchmark results remain pending until actual extension-driving (Playwright + --load-extension) can run "
        "locally with a real Chrome install — see module docstring.\n"
        "Save each run's raw output to evals/results/run-<timestamp>.json "
        "and keep every run, not just the latest, per the project's CI/CD principle."
    )
