# AppSec Multi-Language Corpus

This repository contains compact, intentionally vulnerable sample projects for
build-capture and static-analysis testing. Case identifiers and implementation
names are deliberately neutral. The authoritative machine-readable
applicability data is [`support/project-matrix.json`](support/project-matrix.json).

## Safety boundary

Run the fixtures only in isolated local or CI environments. Do not deploy them
or reuse their vulnerable patterns. Fixtures do not contact arbitrary services,
expose a listener during build, modify host configuration, or perform harmful
actions. The Node and Composer lifecycle hooks write marker files only beneath
their own `.build/` directories. Dependency installation may contact ordinary
package registries.

## Capture applicability

`required` means a compiler or material native/application build must execute
for complete capture. `auto` means a detected package/bundle lifecycle is a
useful material build. `disabled` means the project is interpreted directly;
parsing or byte-compiling it is only syntax validation and must not be reported
as captured build execution.

Important interpreted-language pairs are:

| Source-only fixture | Material lifecycle counterpart |
| --- | --- |
| `projects/python/case-073` (`disabled`) | `projects/python-package/case-085` native extension (`required`) |
| `projects/javascript/case-010` (`disabled`) | `projects/javascript-bundler/case-086` (`auto`), `projects/node-addon/case-087` (`required`), and `projects/node-lifecycle/case-088` (`auto`) |
| `projects/php/case-018` (`disabled`) | `projects/php-composer/case-089` (`auto`) and `projects/php-extension/case-090` (`required`) |

## Prerequisites

Install only the toolchains for cases you intend to build: CMake 3.20+ and a C/C++
compiler, Rust/Cargo, Go, Node.js 22.x and npm, .NET 8, JDK 17+, Kotlin 2.0.x,
PHP 8.3, Python 3.10+, Bash, and PowerShell. Specialized fixtures additionally
need Composer 2.x, PHP development headers plus `phpize`, or the Android tools
listed below. Dependency versions are pinned in manifests and lockfiles where a
dependency manager is used.

## Project build matrix

| Project | Material build command | Capture |
| --- | --- | --- |
| `projects/native/case-083` | `cmake -S . -B build && cmake --build build` | required |
| `projects/native/linux-calibration` | `cmake --preset baseline && cmake --build --preset baseline` | required (calibration, not a vulnerability case) |
| `projects/kotlin/case-084` | `./build.sh` | required |
| `projects/python-package/case-085` | `python3 -m pip wheel . --no-deps --wheel-dir dist` | required |
| `projects/javascript-bundler/case-086` | `npm ci && npm run build` | auto |
| `projects/node-addon/case-087` | `npm ci && npm run build` | required |
| `projects/node-lifecycle/case-088` | `npm ci && npm run build` | auto |
| `projects/php-composer/case-089` | `composer install --no-interaction && composer run build` | auto |
| `projects/php-extension/case-090` | `./build.sh` | required |
| `projects/wasm/case-091` | `./build.sh` | required |
| `projects/android/case-092` | `gradle --no-daemon :app:assembleDebug` | required |

The JSON matrix also records representative existing Rust, Go, .NET, Java,
Python, JavaScript, TypeScript, and PHP cases, compiler artifacts, CodeQL
capability/mode, expected weaknesses, and the exact applicability outcome.

## Android setup

`projects/android/case-092` is a Java 17 Hello World app pinned to Android
Gradle Plugin 8.7.3, Gradle 8.9, compile/target SDK 35, and Build Tools 35.0.0.
Install JDK 17, Android SDK Platform 35, and Build Tools 35.0.0; set
`ANDROID_HOME` (or create an untracked `local.properties` with `sdk.dir`), then
run the matrix command from the project directory. SDKs and generated APKs are
not checked in. The manifest's cleartext-traffic and exported-activity settings
are intentional SAST fixtures (CWE-319 and CWE-926).

## Aggregate validation

On Linux/macOS, `./scripts/build.sh` builds the regular suite. Set
`INCLUDE_CALIBRATION=1` for the larger native calibration project and
`INCLUDE_SPECIALIZED=1` for Composer, phpize, and Android SDK cases. On Windows,
run `./scripts/build.ps1`; `INCLUDE_SPECIALIZED=1` has the same meaning.

Run `./scripts/smoke.sh` or `./scripts/smoke.ps1` after a successful aggregate
build. `python3 scripts/validate-matrix.py` validates matrix shape, unique paths,
capture policies, and project-directory resolution without invoking builds.

Build products, downloaded dependencies, SDK-local configuration, lifecycle
markers, and package outputs are ignored and must remain untracked.
