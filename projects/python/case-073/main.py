import subprocess
import sys

value = sys.argv[1] if len(sys.argv) > 1 else "echo sample"
result = subprocess.run(value, shell=True, capture_output=True, text=True)
print(result.stdout, end="")
