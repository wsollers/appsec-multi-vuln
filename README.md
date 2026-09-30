# AppSec Multi-Language Corpus

This repository contains compact, intentionally imperfect sample projects for benchmark and calibration work. Public case names are opaque by design so evaluations can measure tool behavior without answers appearing in repository labels or documentation.

## Safety

Run these samples only in isolated local or CI environments. Do not deploy them, expose them to untrusted networks, or reuse their patterns in production systems.

## Layout

- `projects/<platform>/case-###`: native and scripting-language sample projects.
- `dockerfiles/case-###`: container build examples.
- `scripts/`: build and smoke-test helpers.
- `.github/workflows/ci.yml`: Linux and Windows validation.

## Setup

Install the toolchains needed for the cases you want to build:

- CMake and a C++ compiler
- Rust
- Go
- Node.js and npm
- .NET SDK
- JDK
- PHP
- Python 3
- Bash
- PowerShell
- Docker, for container examples

## Build

Linux and macOS:

```sh
./scripts/build.sh
```

Windows PowerShell:

```powershell
./scripts/build.ps1
```

## Smoke Tests

Linux and macOS:

```sh
./scripts/smoke.sh
```

Windows PowerShell:

```powershell
./scripts/smoke.ps1
```

The smoke tests check that representative cases start and complete. They do not identify the underlying benchmark conditions.

## Benchmark Use

Use the public repository as the target corpus. Keep scoring material, expected findings, labels, mappings, and evaluator notes outside this repository so benchmark runs remain independent.
