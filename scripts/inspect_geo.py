"""Prints the shape of the India geography release: layers, counts, property
coverage and coordinate extents.

A diagnostic, not part of the build. Run from anywhere:

    python3 scripts/inspect_geo.py [path/to/world-india-geography.json]
"""

import json
import sys
from collections import Counter
from pathlib import Path

# Was an absolute /home/ubuntu/... path, so this only ran on the machine it was
# written on. The default is now derived from the script's own location.
DEFAULT = (
    Path(__file__).resolve().parent.parent
    / 'client' / 'public' / 'data' / 'world-india-geography.json'
)
path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT
if not path.exists():
    raise SystemExit(f'{path} not found; pass the release path as an argument')
with path.open() as handle:
    data = json.load(handle)

print('top_type', type(data).__name__)
print('top_keys', sorted(data.keys()))
print('releaseId', data.get('releaseId'))
print('jurisdiction', data.get('jurisdiction'))
layers = data.get('layers', {})
print('layers', sorted(layers.keys()))


def geometry_summary(features):
    types = Counter()
    coordinates = 0
    for feature in features:
        geometry = feature.get('geometry') if isinstance(feature, dict) else None
        if not isinstance(geometry, dict):
            continue
        types[geometry.get('type', 'missing')] += 1
        coordinates += len(json.dumps(geometry.get('coordinates', []), separators=(',', ':')))
    return dict(types), coordinates


def coordinate_extent(geometry):
    points = []
    def walk(value):
        if isinstance(value, list) and len(value) >= 2 and all(isinstance(item, (int, float)) for item in value[:2]):
            points.append((value[0], value[1]))
        elif isinstance(value, list):
            for child in value:
                walk(child)
    walk((geometry or {}).get('coordinates', []))
    if not points:
        return None
    xs, ys = zip(*points)
    return {'minLng': min(xs), 'maxLng': max(xs), 'minLat': min(ys), 'maxLat': max(ys), 'pointCount': len(points)}


def feature_layer(name, layer):
    features = layer if isinstance(layer, list) else layer.get('features', [])
    print(f'{name}.container', type(layer).__name__)
    print(f'{name}.count', len(features))
    if not features:
        return
    first = features[0]
    print(f'{name}.first_keys', sorted(first.keys()))
    print(f'{name}.first_properties', sorted((first.get('properties') or {}).keys()))
    print(f'{name}.feature_samples', [{key: item.get(key) for key in ('id', 'name', 'isoCode')} for item in features[:5]])
    print(f'{name}.geometry_types', geometry_summary(features)[0])
    print(f'{name}.first_extent', coordinate_extent(first.get('geometry')))
    print(f'{name}.sample_extents', [coordinate_extent(item.get('geometry')) for item in features[:3]])
    props = [feature.get('properties') or {} for feature in features]
    for key in ('id', 'name', 'isoCode', 'admin1Code', 'admin2Code', 'latitude', 'longitude', 'population', 'featureCode'):
        values = [item.get(key) for item in props if item.get(key) not in (None, '')]
        if values:
            print(f'{name}.property.{key}.nonempty', len(values), 'sample', values[:3])


for layer_name, layer in layers.items():
    print(f'layer.{layer_name}.container', type(layer).__name__)
    if isinstance(layer, dict):
        print(f'layer.{layer_name}.keys', sorted(layer.keys()))
        source = layer.get('source')
        if isinstance(source, dict):
            print(f'layer.{layer_name}.source', {k: source.get(k) for k in ('publisher', 'license', 'sourceUrl', 'extract')})
        if isinstance(layer.get('records'), list):
            records = layer['records']
            print(f'layer.{layer_name}.records_count', len(records))
            if records:
                print(f'layer.{layer_name}.record_keys', sorted(records[0].keys()))
                print(f'layer.{layer_name}.record_sample', records[0])
                for key in ('admin1Code', 'admin2Code', 'featureCode', 'population'):
                    values = [item.get(key) for item in records if item.get(key) not in (None, '')]
                    if values:
                        print(f'layer.{layer_name}.record_property.{key}.nonempty', len(values), 'distinct', len(set(values)), 'sample', values[:5])
                if layer_name == 'localities':
                    pop = [item.get('population') for item in records if isinstance(item.get('population'), (int, float))]
                    print('layer.localities.population_stats', {'min': min(pop), 'max': max(pop), '>=5000': sum(value >= 5000 for value in pop), 'count': len(pop)})
        elif isinstance(layer.get('features'), list):
            feature_layer(f'layer.{layer_name}.features', layer)
    elif isinstance(layer, list):
        feature_layer(f'layer.{layer_name}', layer)

adm1 = layers.get('adm1', {})
adm2 = layers.get('adm2', {})
localities = layers.get('localities', {})
if isinstance(adm1, dict) and isinstance(adm1.get('features'), list):
    print('hierarchy.adm1_ids', len({str((f.get('properties') or {}).get('id')) for f in adm1['features']}))
if isinstance(adm2, dict) and isinstance(adm2.get('features'), list):
    print('hierarchy.adm2_ids', len({str((f.get('properties') or {}).get('id')) for f in adm2['features']}))
if isinstance(localities, dict) and isinstance(localities.get('records'), list):
    print('hierarchy.locality_admin1_codes', len({r.get('admin1Code') for r in localities['records'] if r.get('admin1Code')}))
    print('hierarchy.locality_admin2_codes', len({r.get('admin2Code') for r in localities['records'] if r.get('admin2Code')}))
