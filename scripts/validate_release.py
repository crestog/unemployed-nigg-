#!/usr/bin/env python3
"""Check that the emitted data release agrees with its own manifest.

This existed as an inline heredoc in .github/workflows/refresh-data.yml, gated on
`steps.download.outputs.complete == 'true'`. That condition requires all six
source packages, three of which are not machine-fetchable and land in a gitignored
data/raw, so on a clean runner the download step exits 3 and the gate has never
once executed. Meanwhile `pnpm data:refresh` — the path actually used to produce
every release in the tree — ran no validation at all. Moving the checks into a
script is what lets both paths call them.

The heredoc's strongest-reading assertion was also its weakest:

    assert manifest["integrity"]["syntheticRecords"] == 0

build_real_data.py writes that literal `0` itself, so the assertion restates the
producer instead of checking it. It cannot fail. The replacement is a recount: the
manifest's numbers are recomputed from the emitted files, and every emitted record
is required to name a publisher the manifest declares as a source. A fabricated or
truncated release fails that; a self-consistent one cannot.

Two of the four link counts describe the *source* corpus rather than the shipped
arrays, because build_real_data.py truncates (`tasks[:10]`, `skills[:12]`,
`workActivities[:20]`) for payload size while counting from `metrics`. So the
recount reads `metrics`, and a separate invariant checks the emitted arrays never
exceed what `metrics` claims — which is the direction a fabricated metric would
break.

Every failure is collected and reported together. A validator that stops at the
first problem is one you run eight times.

Exit codes:
  0  the release is internally consistent.
  1  at least one check failed, or a required file is missing or unparseable.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "client" / "public" / "data"
MANIFEST = DATA / "manifest.json"

SHA256 = re.compile(r"\A[0-9a-f]{64}\Z")

# Mirrors the slices in build_real_data.py:217-222. Kept here deliberately rather
# than imported: if someone widens a cap there, this file should have to change
# too, so the payload growth is visible in the diff.
TRUNCATION_CAPS = {
    "tasks": ("taskCount", 10),
    "skills": ("skillCount", 12),
    "workActivities": ("workActivityCount", 20),
}

# The floors ported from the refresh-data.yml heredoc. These catch a release that
# silently lost a whole join — the BLS wage/projection merges and the ISCO
# taxonomy each used to be able to vanish while the O*NET-derived numbers above
# them still looked healthy.
FLOORS = {
    "occupations": 900,
    "taskStatementCount": 10_000,
    "occupationsWithBls": 900,
    "occupationsWithBlsProjections": 900,
    "isco": 500,
    "naics": 2_000,
    "isic": 800,
}

# counts key -> the `taxonomy` field value carried by those records. There is no
# `system` field on a taxonomy record; a Counter over `system` returns
# {None: 3574}, so keying a split on it would silently validate nothing.
TAXONOMY_LABELS = {
    "naics": "NAICS 2022",
    "isic": "ISIC Rev. 5",
    "isco": "ISCO-08",
}

SOURCE_FIELDS = ("publisher", "title", "vintage", "url", "license", "sha256", "file")


class Failures:
    """Accumulates problems so one run reports all of them."""

    def __init__(self) -> None:
        self.items: list[str] = []

    def check(self, condition: bool, message: str) -> bool:
        if not condition:
            self.items.append(message)
        return condition

    def equal(self, label: str, actual: Any, expected: Any) -> bool:
        return self.check(
            actual == expected, f"{label}: manifest says {expected!r}, files give {actual!r}"
        )


def load(path: Path, failures: Failures) -> Any:
    if not path.exists():
        failures.items.append(f"missing file: {path.relative_to(ROOT).as_posix()}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        failures.items.append(f"unparseable: {path.relative_to(ROOT).as_posix()}: {error}")
        return None


def check_sources(manifest: dict[str, Any], failures: Failures) -> set[str]:
    """Every declared source must be fully attributed. Returns the publisher set."""
    sources = manifest.get("sources")
    if not failures.check(
        isinstance(sources, list) and len(sources) >= 6,
        f"manifest.sources should list at least 6 packages, got {len(sources) if isinstance(sources, list) else sources!r}",
    ):
        return set()

    publishers: set[str] = set()
    for index, source in enumerate(sources):
        if not isinstance(source, dict):
            failures.items.append(f"manifest.sources[{index}] is not an object")
            continue
        label = source.get("title") or source.get("publisher") or f"index {index}"
        for field in SOURCE_FIELDS:
            value = source.get(field)
            failures.check(
                isinstance(value, str) and value.strip() != "",
                f"manifest.sources[{index}] ({label}) has an empty or missing {field!r}",
            )
        digest = source.get("sha256")
        if isinstance(digest, str) and digest.strip():
            # A release whose provenance digests were hand-edited or defaulted is
            # not a release whose sources can be re-verified later.
            failures.check(
                bool(SHA256.fullmatch(digest)),
                f"manifest.sources[{index}] ({label}) sha256 is not 64 lowercase hex chars: {digest!r}",
            )
        publisher = source.get("publisher")
        if isinstance(publisher, str) and publisher.strip():
            publishers.add(publisher)
    return publishers


def check_record_provenance(
    records: list[dict[str, Any]], collection: str, publishers: set[str], failures: Failures
) -> None:
    """The real replacement for `syntheticRecords == 0`.

    Rather than trusting a literal the producer wrote, require every emitted
    record to name a publisher the manifest independently declares. A record
    invented in the build — or carried over from a source that was dropped from
    the manifest — has nowhere to hide.
    """
    unattributed = 0
    undeclared: dict[str, int] = {}
    for record in records:
        source = record.get("source")
        if not isinstance(source, dict):
            unattributed += 1
            continue
        publisher = source.get("publisher")
        if not isinstance(publisher, str) or not publisher.strip():
            unattributed += 1
        elif publisher not in publishers:
            undeclared[publisher] = undeclared.get(publisher, 0) + 1

    failures.check(
        unattributed == 0,
        f"{collection}: {unattributed} record(s) carry no source publisher",
    )
    for publisher, count in sorted(undeclared.items()):
        failures.items.append(
            f"{collection}: {count} record(s) cite {publisher!r}, which manifest.sources does not declare"
        )


def check_occupations(
    occupations: list[dict[str, Any]], counts: dict[str, Any], failures: Failures
) -> None:
    failures.equal("occupations.json length", len(occupations), counts.get("occupations"))
    # Two manifest keys hold the same number; a release where they diverge means
    # one of the two producers changed and the other did not.
    failures.equal(
        "occupations.json length vs occupationCount", len(occupations), counts.get("occupationCount")
    )

    metric_totals = {"taskCount": 0, "skillCount": 0, "workActivityCount": 0}
    related = 0
    with_bls = 0
    with_projections = 0
    missing_metrics = 0
    overruns: list[str] = []

    for record in occupations:
        metrics = record.get("metrics")
        if not isinstance(metrics, dict):
            missing_metrics += 1
            continue
        for key in metric_totals:
            value = metrics.get(key)
            if isinstance(value, int):
                metric_totals[key] += value
            else:
                failures.items.append(
                    f"occupations.json: {record.get('soc', '?')} metrics.{key} is {value!r}, not an int"
                )
        related += len(record.get("relatedOccupations") or [])
        if record.get("laborMarket"):
            with_bls += 1
        if record.get("outlook"):
            with_projections += 1
        for field, (metric_key, cap) in TRUNCATION_CAPS.items():
            emitted = len(record.get(field) or [])
            claimed = metrics.get(metric_key)
            if isinstance(claimed, int) and emitted > min(cap, claimed):
                overruns.append(
                    f"{record.get('soc', '?')}.{field}: {emitted} emitted > min(cap {cap}, metrics.{metric_key} {claimed})"
                )

    failures.check(
        missing_metrics == 0, f"occupations.json: {missing_metrics} record(s) have no metrics object"
    )
    for overrun in overruns[:10]:
        failures.items.append(f"occupations.json truncation invariant broken: {overrun}")
    if len(overruns) > 10:
        failures.items.append(
            f"occupations.json: {len(overruns) - 10} further truncation overrun(s) not listed"
        )

    failures.equal(
        "taskStatementCount", metric_totals["taskCount"], counts.get("taskStatementCount")
    )
    failures.equal(
        "occupationSkillLinkCount", metric_totals["skillCount"], counts.get("occupationSkillLinkCount")
    )
    failures.equal(
        "workActivityLinkCount",
        metric_totals["workActivityCount"],
        counts.get("workActivityLinkCount"),
    )
    failures.equal("relatedOccupationLinkCount", related, counts.get("relatedOccupationLinkCount"))
    # These two are the joins the original heredoc could not see going missing.
    failures.equal("occupationsWithBls", with_bls, counts.get("occupationsWithBls"))
    failures.equal(
        "occupationsWithBlsProjections", with_projections, counts.get("occupationsWithBlsProjections")
    )


def check_taxonomies(
    taxonomies: list[dict[str, Any]], counts: dict[str, Any], failures: Failures
) -> None:
    per_label: dict[str, int] = {}
    for record in taxonomies:
        label = record.get("taxonomy")
        if isinstance(label, str):
            per_label[label] = per_label.get(label, 0) + 1

    declared_total = 0
    for key, label in TAXONOMY_LABELS.items():
        expected = counts.get(key)
        failures.equal(f"taxonomies.json {label} rows", per_label.get(label, 0), expected)
        if isinstance(expected, int):
            declared_total += expected

    # The whole-file check: a taxonomy row belonging to none of the three declared
    # systems would satisfy every per-system count above and still be shipped.
    failures.equal("taxonomies.json length vs naics+isic+isco", len(taxonomies), declared_total)

    unexpected = sorted(set(per_label) - set(TAXONOMY_LABELS.values()))
    for label in unexpected:
        failures.items.append(
            f"taxonomies.json: {per_label[label]} row(s) carry undeclared taxonomy {label!r}"
        )


def main() -> None:
    failures = Failures()

    manifest = load(MANIFEST, failures)
    if not isinstance(manifest, dict):
        raise SystemExit(report(failures))

    failures.check(
        manifest.get("mode") == "real-source-release",
        f"manifest.mode is {manifest.get('mode')!r}, expected 'real-source-release'",
    )
    failures.check(
        isinstance(manifest.get("releaseId"), (str, int)) and str(manifest.get("releaseId")).strip() != "",
        f"manifest.releaseId is {manifest.get('releaseId')!r}",
    )

    counts = manifest.get("counts")
    if not isinstance(counts, dict):
        failures.items.append(f"manifest.counts is {counts!r}, not an object")
        raise SystemExit(report(failures))

    for key, floor in FLOORS.items():
        value = counts.get(key)
        if isinstance(value, int):
            failures.check(value > floor, f"counts.{key} is {value}, expected more than {floor}")
        else:
            failures.items.append(f"counts.{key} is {value!r}, not an int")

    publishers = check_sources(manifest, failures)

    collections = manifest.get("collections")
    if not isinstance(collections, dict):
        failures.items.append(f"manifest.collections is {collections!r}, not an object")
        raise SystemExit(report(failures))

    loaded: dict[str, Any] = {}
    for name, filename in sorted(collections.items()):
        if not isinstance(filename, str) or not filename.strip():
            failures.items.append(f"manifest.collections[{name!r}] is {filename!r}")
            continue
        loaded[name] = load(DATA / filename, failures)

    occupations = loaded.get("occupations")
    if isinstance(occupations, list):
        check_occupations(occupations, counts, failures)
        check_record_provenance(occupations, "occupations.json", publishers, failures)
    elif occupations is not None:
        failures.items.append("occupations.json is not a list")

    taxonomies = loaded.get("taxonomies")
    if isinstance(taxonomies, list):
        check_taxonomies(taxonomies, counts, failures)
        check_record_provenance(taxonomies, "taxonomies.json", publishers, failures)
    elif taxonomies is not None:
        failures.items.append("taxonomies.json is not a list")

    international = loaded.get("international")
    if international is not None:
        failures.check(
            bool(international),
            "international.json is empty; the ESCO/ISCO module would render blank",
        )

    if failures.items:
        raise SystemExit(report(failures))

    print(f"release {manifest['releaseId']} validated")
    print(f"  occupations       {len(occupations):>6}  ({counts['occupationsWithBls']} with BLS wages,")
    print(f"                            {counts['occupationsWithBlsProjections']} with projections)")
    print(f"  taxonomy rows     {len(taxonomies):>6}  (" + ", ".join(
        f"{label} {counts[key]}" for key, label in TAXONOMY_LABELS.items()
    ) + ")")
    print(f"  task statements   {counts['taskStatementCount']:>6}")
    print(f"  skill links       {counts['occupationSkillLinkCount']:>6}")
    print(f"  activity links    {counts['workActivityLinkCount']:>6}")
    print(f"  related links     {counts['relatedOccupationLinkCount']:>6}")
    # Fewer publishers than sources is normal: the two BLS packages share one.
    print(
        f"  sources           {len(manifest['sources']):>6} packages"
        f" from {len(publishers)} publishers, all digested"
    )


def report(failures: Failures) -> str:
    lines = ["", f"{len(failures.items)} release integrity check(s) failed:", ""]
    lines += [f"  - {item}" for item in failures.items]
    lines += ["", "The release in client/public/data does not agree with its own manifest.", ""]
    return "\n".join(lines)


if __name__ == "__main__":
    main()
