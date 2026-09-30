import sys

import yaml

path = sys.argv[1] if len(sys.argv) > 1 else "config.yaml"
with open(path, encoding="utf-8") as handle:
    config = yaml.load(handle, Loader=yaml.FullLoader)
print(config)
