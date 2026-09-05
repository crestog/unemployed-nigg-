#!/usr/bin/env python3
"""Fetch the public source packages that build_real_data.py reads from data/raw.

Not all six of them can be fetched. The Bureau of Labor Statistics serves an
"Access Denied" page to automated retrieval — their stated usage policy prohibits
bot activity, and it is enforced ahead of the file, so a 403 comes back for every
User-Agent. The ILO's ISCO-08 workbook has moved and has no stable published URL.
Those three are therefore declared, not downloaded: the script says exactly which
files a human must place and where, and exits non-zero rather than letting
build_real_data.py fail later with a bare list of keys.

Anything already sitting in data/raw is left alone, so seeding the manual files
once is enough for a subsequent run to get all the way through.

Exit codes, because refresh-data.yml has to tell two different "incomplete"
outcomes apart and only one of them is a fault:

  0  all six packages are in data/raw; build_real_data.py can run.
  3  every fetchable package was obtained and the only thing missing is one a
     human has to place. Requires --tolerate-unseeded; without it this is a 1,
     which is what a developer running the script by hand wants.
  1  something is wrong: a pinned URL stopped serving, or the network failed.
"""

from __future__ import annotations

import argparse
import time
import urllib.error
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
RAW.mkdir(parents=True, exist_ok=True)

USER_AGENT = "IndustryNicheAtlas/1.0 (research; source download)"
ATTEMPTS = 3

# Pinned deliberately: build_real_data.py records each file's sha256 and vintage
# in the release manifest, so a moving "latest" URL would make two releases with
# the same releaseId describe different data.
DOWNLOADS = {
    "onet_30_3_csv.zip": "https://www.onetcenter.org/dl_files/database/db_30_3_csv.zip",
    "naics_2022_structure.xlsx": "https://www.census.gov/naics/2022NAICS/2022_NAICS_Structure.xlsx",
    "isic_rev5_structure.csv": "https://unstats.un.org/unsd/classifications/Econ/Download/In%20Text/ISIC_Rev_5_english_structure.csv",
}

# Files build_real_data.py requires that this script cannot legitimately fetch.
SUPPLIED = {
    "bls_oesm25nat.zip": (
        "May 2025 OEWS national tables (national_M2025_dl.xlsx inside the zip)",
        "https://www.bls.gov/oes/tables.htm",
        "BLS blocks automated retrieval; download it in a browser.",
    ),
    "bls_ep_2024_2034_occupation.xlsx": (
        "Occupational projections 2024-2034, table 1.2",
        "https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm",
        "BLS blocks automated retrieval; download it in a browser.",
    ),
    "isco_08_structure.xlsx": (
        "ISCO-08 structure and definitions",
        "https://ilostat.ilo.org/methods/concepts-and-definitions/classification-occupation/",
        "The published URL has moved; take the current workbook link from the page.",
    ),
}


def download(name: str, url: str) -> None:
    """Fetch one file, retrying only the failures that could be transient."""
    destination = RAW / name
    request = Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(1, ATTEMPTS + 1):
        try:
            with urlopen(request, timeout=120) as response:
                with destination.open("wb") as output:
                    while chunk := response.read(1024 * 1024):
                        output.write(chunk)
            print(f"  downloaded {name} ({destination.stat().st_size:,} bytes)")
            return
        except urllib.error.HTTPError as error:
            # 4xx will not change on a retry, and a partial file left behind
            # would read as success on the next run.
            destination.unlink(missing_ok=True)
            if error.code < 500:
                print(f"  FAILED  {name}: HTTP {error.code} {error.reason} <{url}>")
                return
            reason = f"HTTP {error.code} {error.reason}"
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            destination.unlink(missing_ok=True)
            reason = str(error)
        if attempt == ATTEMPTS:
            print(f"  FAILED  {name}: {reason} <{url}>")
            return
        delay = 2**attempt
        print(f"  retrying {name} in {delay}s ({reason})")
        time.sleep(delay)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch the public source packages build_real_data.py reads.",
        epilog=(
            "Exit codes: 0 all six present; 3 fetchable ones obtained but an "
            "operator-supplied one is unseeded (only with --tolerate-unseeded); "
            "1 a pinned URL or the network failed."
        ),
    )
    parser.add_argument(
        "--tolerate-unseeded",
        action="store_true",
        help=(
            "exit 3 rather than 1 when the only missing packages are the three a "
            "human has to download in a browser. Used by the monthly refresh, so "
            "an unseeded runner is a clean stop instead of a red failure, while a "
            "pinned URL that stopped serving still fails."
        ),
    )
    arguments = parser.parse_args()

    print(f"source packages -> {RAW}")
    for name, url in DOWNLOADS.items():
        existing = RAW / name
        if existing.exists():
            print(f"  present {name} ({existing.stat().st_size:,} bytes), not re-fetching")
            continue
        download(name, url)

    # Split rather than combined: which set a missing file belongs to is the
    # difference between "nobody has seeded this runner yet" and "a URL we pinned
    # stopped serving", and only the second is a fault.
    missing_fetchable = [name for name in DOWNLOADS if not (RAW / name).exists()]
    missing_supplied = [name for name in SUPPLIED if not (RAW / name).exists()]
    missing = [*missing_fetchable, *missing_supplied]
    if not missing:
        print("all six source packages are present")
        return

    lines = [
        "",
        f"{len(missing)} source package(s) are missing, so build_real_data.py cannot run:",
        "",
    ]
    for name in missing:
        if name in SUPPLIED:
            title, page, why = SUPPLIED[name]
            lines += [f"  {name}", f"    {title}", f"    {why}", f"    {page}", ""]
        else:
            lines += [f"  {name}", f"    download failed: {DOWNLOADS[name]}", ""]
    lines += [f"Place them in {RAW} and run this script again.", ""]
    message = "\n".join(lines)

    if arguments.tolerate_unseeded and not missing_fetchable:
        # Everything a runner can legitimately obtain was obtained, which is the
        # part worth checking monthly: these URLs are pinned and do rot.
        print(message)
        raise SystemExit(3)
    raise SystemExit(message)


if __name__ == "__main__":
    main()
