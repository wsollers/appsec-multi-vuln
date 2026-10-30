# case-093

Polyglot workspace in which one shared C/C++ record library is used by four
front ends, each through a different binding:

| Path | Build system | Role |
| --- | --- | --- |
| `CMakeLists.txt` | CMake | Superbuild for the native tree and the C command-line app |
| `native/core` | CMake | C11 record library, built as `libcore.so` and `libcore.a` |
| `native/core/codec` | CMake | C++17 static library with a C interface, linked into `core` |
| `native/bridge-jni` | CMake | C++ JNI library `libc093jni.so`, linked against `core` |
| `apps/cli` | CMake | C program `case093`, statically linked against `core` |
| `apps/jvm` | Maven | Aggregator for the `binding` and `service` modules |
| `apps/jvm/binding` | Maven | Java native method declarations served by `libc093jni.so` |
| `apps/jvm/service` | Maven | Java app that loads the bridge library and calls `binding` |
| `apps/py` | setuptools | Python app that loads `libcore.so` with `ctypes` |
| `apps/py/ext` | setuptools | CPython extension that compiles `native/core/src/record.c` |
| `apps/go` | Go workspace | `go.work` over the `recordc` and `gateway` modules |
| `apps/go/recordc` | Go (cgo) | Wrapper that includes `core/record.h` and links `libcore` |
| `apps/go/gateway` | Go | Program that stores a record body under an output directory |

Records are framed as `name;kind;length;body`; `samples/sample.rec` is a small
example.

Build order matters: the Maven, ctypes, and cgo front ends need the native
outputs under `build/`, and the extension and the cgo wrapper read sources and
headers from `native/core`. Requires CMake 3.24+, a C/C++ compiler, JDK 17 and
Maven, Python 3.10+ with development headers, and Go 1.22+ with cgo.

Build: `./build.sh`.

Run from this directory after building:

- `build/apps/cli/case093 samples/sample.rec`
- `java -cp apps/jvm/binding/target/c093-binding-1.0.0.jar:apps/jvm/service/target/c093-service-1.0.0.jar org.example.c093.service.Main describe samples/sample.rec`
- `PYTHONPATH=apps/py python3 -m c093app name sample`
- `build/go/gateway samples/sample.rec OUTDIR`
