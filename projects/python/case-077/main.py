import sys

value = sys.argv[1] if len(sys.argv) > 1 else "1 + 1"
print(eval(value))
