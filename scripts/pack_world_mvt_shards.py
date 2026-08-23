from __future__ import annotations

import argparse
import json
import shutil
from collections import defaultdict
from pathlib import Path

MAX_SHARD_BYTES = 8 * 1024 * 1024


def write_shard(layer_root: Path, packed_root: Path, zoom: str, x: str, files: list[Path]) -> tuple[int, int, int]:
    target_root = packed_root / layer_root.name / zoom
    target_root.mkdir(parents=True, exist_ok=True)
    shard_path = target_root / f"{x}.bin"
    index_path = target_root / f"{x}.json"
    part = 0
    shard = bytearray()
    index: dict[str, list[int | str]] = {}
    written_tiles = 0
    total_bytes = 0

    def flush() -> None:
        nonlocal part, shard, index
        if not shard:
            return
        suffix = "" if part == 0 else f".{part}"
        actual_shard = target_root / f"{x}{suffix}.bin"
        actual_index = target_root / f"{x}{suffix}.json"
        actual_shard.write_bytes(shard)
        actual_index.write_text(json.dumps(index, separators=(",", ":")) + "\n", encoding="utf-8")
        part += 1
        shard = bytearray()
        index = {}

    for tile_path in files:
        y = tile_path.stem
        payload = tile_path.read_bytes()
        if len(payload) > MAX_SHARD_BYTES:
            raise RuntimeError(f"single tile exceeds shard limit: {tile_path} ({len(payload)} bytes)")
        if shard and len(shard) + len(payload) > MAX_SHARD_BYTES:
            flush()
        offset = len(shard)
        shard.extend(payload)
        index[y] = [offset, len(payload)]
        written_tiles += 1
        total_bytes += len(payload)
    flush()
    return written_tiles, total_bytes, part


def pack_release(release: Path) -> dict[str, object]:
    packed_root = release / "packed"
    if packed_root.exists():
        shutil.rmtree(packed_root)
    summary: dict[str, object] = {"maxShardBytes": MAX_SHARD_BYTES, "layers": {}}
    for layer_root in sorted(p for p in release.iterdir() if p.is_dir() and p.name not in {"packed"}):
        tile_groups: dict[tuple[str, str], list[Path]] = defaultdict(list)
        for tile_path in sorted(layer_root.rglob("*.pbf")):
            relative = tile_path.relative_to(layer_root)
            if len(relative.parts) != 3:
                raise RuntimeError(f"unexpected tile path: {tile_path}")
            zoom, x, _ = relative.parts
            tile_groups[(zoom, x)].append(tile_path)
        if not tile_groups:
            continue
        layer_tiles = 0
        layer_bytes = 0
        shard_count = 0
        max_shard_bytes = 0
        for (zoom, x), files in sorted(tile_groups.items()):
            tiles, byte_count, parts = write_shard(layer_root, packed_root, zoom, x, files)
            layer_tiles += tiles
            layer_bytes += byte_count
            shard_count += parts
            for shard_path in (packed_root / layer_root.name / zoom).glob(f"{x}*.bin"):
                max_shard_bytes = max(max_shard_bytes, shard_path.stat().st_size)
        summary["layers"][layer_root.name] = {
            "tileCount": layer_tiles,
            "tileBytes": layer_bytes,
            "shardCount": shard_count,
            "maxShardBytes": max_shard_bytes,
        }
        shutil.rmtree(layer_root)
    (release / "packed-manifest.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Pack MVT PBFs into bounded static shards while retaining logical tile URLs.")
    parser.add_argument("release", type=Path)
    args = parser.parse_args()
    summary = pack_release(args.release.resolve())
    print(json.dumps(summary, indent=2), flush=True)


if __name__ == "__main__":
    main()
