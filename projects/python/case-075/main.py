import pickle
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "state.bin"
with open(path, "rb") as handle:
    state = pickle.loads(handle.read())
print(state)
