"""Connector specifications — the YAML property files.

Each connector folder carries one ``_props.<platform>.yaml`` file describing the
connector's identity, capabilities, auth, the properties it needs (its config
contract), and the object catalogue it understands. The common ``_props.``
prefix means these files are trivially globbed — or ``.gitignore``d / skipped —
as a group, and keeping them beside the Python keeps a connector self-contained.

This module is the typed view over that YAML, plus :func:`load_spec_file`.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

#: every connector property file matches this glob within a connector folder
PROPS_GLOB = "_props.*.yaml"

#: completeness of a connector in the long-running repository
STATUS_COMPLETE = "complete"          # production-ready, doc-verified
STATUS_INCOMPLETE = "incomplete"      # stub / partial — a research target
STATUS_RESEARCH_DERIVED = "research_derived"  # built by the extraction agent; pending verification


@dataclass
class PropertySpec:
    """One configuration property a connection must supply."""

    name: str
    required: bool = False
    secret: bool = False
    description: str = ""
    default: Any = None
    example: str = ""


@dataclass
class ObjectSpec:
    """One platform object/module the connector can move."""

    api_name: str                         # the platform's name, e.g. "Account"
    domain_model: str = ""                # canonical name, e.g. "Account"
    fields: list[str] = field(default_factory=list)


@dataclass
class ConnectorSpec:
    """Typed view of a ``_props.*.yaml`` file."""

    platform: str
    domain: str
    display_name: str
    module: str                           # importable module path
    class_name: str                       # connector class in that module
    status: str = STATUS_INCOMPLETE
    version: int = 1
    auth_type: str = "none"
    description: str = ""
    capabilities: dict[str, bool] = field(default_factory=dict)
    properties: list[PropertySpec] = field(default_factory=list)
    objects: list[ObjectSpec] = field(default_factory=list)
    source_path: str = ""                 # the YAML file this came from

    @property
    def key(self) -> str:
        return f"{self.platform}.{self.domain}"

    @property
    def required_properties(self) -> list[str]:
        return [p.name for p in self.properties if p.required]

    def public_dict(self) -> dict[str, Any]:
        """Catalogue view — never leaks secret *values* (there are none here)."""
        return {
            "key": self.key,
            "platform": self.platform,
            "domain": self.domain,
            "display_name": self.display_name,
            "status": self.status,
            "version": self.version,
            "auth_type": self.auth_type,
            "description": self.description,
            "capabilities": self.capabilities,
            "properties": [
                {
                    "name": p.name,
                    "required": p.required,
                    "secret": p.secret,
                    "description": p.description,
                    "example": p.example,
                }
                for p in self.properties
            ],
            "objects": [
                {"api_name": o.api_name, "domain_model": o.domain_model, "fields": o.fields}
                for o in self.objects
            ],
        }


def parse_spec(data: dict[str, Any], *, source_path: str = "") -> ConnectorSpec:
    """Build a :class:`ConnectorSpec` from a parsed YAML mapping."""
    c = data.get("connector", {})
    missing = [k for k in ("platform", "domain", "module", "class") if not c.get(k)]
    if missing:
        raise ValueError(f"{source_path or 'spec'}: connector missing keys {missing}")
    return ConnectorSpec(
        platform=c["platform"],
        domain=c["domain"],
        display_name=c.get("display_name", c["platform"].title()),
        module=c["module"],
        class_name=c["class"],
        status=c.get("status", STATUS_INCOMPLETE),
        version=int(c.get("version", 1)),
        auth_type=data.get("auth", {}).get("type", "none"),
        description=c.get("description", ""),
        capabilities=data.get("capabilities", {}) or {},
        properties=[
            PropertySpec(
                name=p["name"],
                required=bool(p.get("required", False)),
                secret=bool(p.get("secret", False)),
                description=p.get("description", ""),
                default=p.get("default"),
                example=p.get("example", ""),
            )
            for p in data.get("properties", []) or []
        ],
        objects=[
            ObjectSpec(
                api_name=o["api_name"],
                domain_model=o.get("domain_model", o["api_name"]),
                fields=list(o.get("fields", []) or []),
            )
            for o in data.get("objects", []) or []
        ],
        source_path=source_path,
    )


def load_spec_file(path: str | Path) -> ConnectorSpec:
    """Parse a single ``_props.*.yaml`` file into a :class:`ConnectorSpec`."""
    import yaml  # lazy — only needed when scanning the catalogue

    path = Path(path)
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return parse_spec(data, source_path=str(path))
