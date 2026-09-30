import os
import sys

base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
name = sys.argv[1] if len(sys.argv) > 1 else "item.txt"
with open(os.path.join(base, name), encoding="utf-8") as handle:
    print(handle.read(), end="")
