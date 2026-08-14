#!/usr/bin/env python3
"""Download only the public source packages used by build_real_data.py."""

from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
RAW.mkdir(parents=True, exist_ok=True)

FILES = {
    "onet_30_3_csv.zip": "https://www.onetcenter.org/dl_files/database/db_30_3_csv.zip",
    "naics_2022_structure.xlsx": "https://www.census.gov/naics/2022NAICS/2022_NAICS_Structure.xlsx",
    "isic_rev5_structure.csv": "https://unstats.un.org/unsd/classifications/Econ/Download/In%20Text/ISIC_Rev_5_english_structure.csv",
    "bls_oesm25nat.zip": "https://www.bls.gov/oes/special-requests/oesm25nat.zip",
}


def download(name: str, url: str) -> None:
    destination = RAW / name
    request = Request(url, headers={"User-Agent": "IndustryNicheAtlas/1.0 (research; source download)"})
    with urlopen(request, timeout=120) as response, destination.open("wb") as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)
    print(f"downloaded {name} ({destination.stat().st_size:,} bytes)")


for filename, url in FILES.items():
    download(filename, url)

