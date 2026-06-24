"""Extraction-agent orchestrator (research mode).

Standalone runbook module — *not* imported by the FastAPI app. It turns a
``(platform, domain)`` request into a deep-research **brief**, and turns the
resulting research report into a ``ConnectorSpec`` / ``_props.<platform>.yaml``.

The intelligence lives in the deep-research harness and the playbook in
``README.md``; this module just builds the prompt and serializes the output so a
human (or an automated agent) can review the spec before code is generated.

Usage (from the repo root)::

    # 1. print the research brief to feed to deep-research
    python meridian/connectors/agents/extraction-agent/extractor.py zoho crm

    # 2. after running deep-research, distill its report into a props file
    python .../extractor.py zoho crm --report report.md --emit
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_BRIEF_TEMPLATE = """\
Research the official **{platform}** developer documentation for the **{domain}**
domain and derive a verifiable connector spec. Use only primary docs; mark any
fact you cannot confirm as UNVERIFIED rather than guessing.

Return concrete values for:

1. AUTHENTICATION — scheme, exact token endpoint URL, refresh/grant request shape,
   and the `Authorization` header format. Note any multi-data-centre base-URL split.
2. BASE URLS — the API root and version path segment.
3. OBJECT CATALOGUE — for {domain}, the canonical objects {objects} with their API
   field names + types; map each to a Meridian domain_model.
4. PULL — read endpoint, pagination params, cursor/next mechanism, modified-since
   incremental filter, and the response envelope shape.
5. PUSH — insert / update / upsert endpoints, batch limits, and the per-record
   result envelope.
6. RATE LIMITS — quota model and 429 behaviour.

Cite the exact doc URL each section was verified against (a "Sources" list).
"""


def build_research_brief(platform: str, domain: str, objects: list[str] | None = None) -> str:
    """Render the deep-research brief for one platform+domain."""
    obj_hint = (
        f"(prioritise: {', '.join(objects)})" if objects else "(discover the standard objects)"
    )
    return _BRIEF_TEMPLATE.format(platform=platform, domain=domain, objects=obj_hint)


def distill_spec_yaml(platform: str, domain: str, report_text: str) -> str:
    """Best-effort skeleton ``_props.<platform>.yaml`` seeded from a report.

    The deep-research report is human/LLM prose; turning it into a precise spec is
    a judgement step. This emits a reviewable skeleton with the report's findings
    folded in as comments and ``status: research_derived`` so it can never be
    mistaken for a doc-verified connector.
    """
    head = "\n".join(f"# {line}" for line in report_text.strip().splitlines()[:40])
    return f"""\
# Auto-distilled from a deep-research report. REVIEW before use.
# ---- research findings (truncated) ----
{head}
# ----------------------------------------
connector:
  platform: {platform}
  domain: {domain}
  display_name: {platform.title()} {domain.upper()}
  status: research_derived   # NOT verified — promote to `complete` after doc check
  version: 1
  module: meridian.connectors.catalog.{platform}.{domain}
  class: {platform.title()}{domain.upper()}Connector

auth:
  type: TODO   # fill from finding #1

capabilities:
  pull: true
  push: true
  incremental: false
  upsert: false

properties:
  - name: access_token
    required: true
    secret: true
    description: TODO from finding #1

objects: []   # fill from finding #3
"""


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Connector extraction agent (research mode)")
    parser.add_argument("platform")
    parser.add_argument("domain")
    parser.add_argument("--objects", nargs="*", default=None)
    parser.add_argument("--report", type=Path, default=None, help="deep-research report file")
    parser.add_argument("--emit", action="store_true", help="emit the props YAML skeleton")
    args = parser.parse_args(argv)

    if args.report and args.emit:
        report = args.report.read_text(encoding="utf-8")
        sys.stdout.write(distill_spec_yaml(args.platform, args.domain, report))
        return 0

    sys.stdout.write(build_research_brief(args.platform, args.domain, args.objects))
    sys.stdout.write("\n\n# Feed the brief above to the `deep-research` skill.\n")
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
