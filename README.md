# AppSec Multi-Language Corpus

This repository contains compact sample projects used to exercise common language, build, and packaging configurations. Case identifiers and implementation names are intentionally neutral.

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

The smoke tests check that representative cases start and complete. Native programs under `projects/cpp/case-001/workspace` are build-only and are not started by these scripts.
