"""ctypes declarations for the shared core library."""

import ctypes
import os
from pathlib import Path

NAME_MAX = 32
BODY_MAX = 64


class Record(ctypes.Structure):
    _fields_ = [
        ("name", ctypes.c_char * NAME_MAX),
        ("body", ctypes.c_ubyte * BODY_MAX),
        ("kind", ctypes.c_int),
        ("len", ctypes.c_int),
    ]


def _default_path() -> Path:
    return Path(__file__).resolve().parents[3] / "build" / "native" / "core" / "libcore.so"


def open_library(path=None):
    lib = ctypes.CDLL(str(path or os.environ.get("C093_LIB") or _default_path()))
    lib.core_parse.argtypes = [ctypes.c_char_p, ctypes.c_size_t, ctypes.POINTER(Record)]
    lib.core_parse.restype = ctypes.c_int
    lib.core_copy_name.argtypes = [ctypes.c_char_p, ctypes.c_size_t, ctypes.c_char_p, ctypes.c_size_t]
    lib.core_copy_name.restype = ctypes.c_size_t
    lib.core_describe.argtypes = [ctypes.POINTER(Record), ctypes.c_void_p]
    lib.core_free.argtypes = [ctypes.c_void_p]
    lib.core_free.restype = None
    return lib


def describe(lib, data: bytes) -> str:
    record = Record()
    if lib.core_parse(data, len(data), ctypes.byref(record)) != 0:
        raise ValueError("unreadable record")
    text = lib.core_describe(ctypes.byref(record), None)
    try:
        return ctypes.string_at(text).decode("utf-8", "replace")
    finally:
        lib.core_free(text)


def short_name(lib, value: str) -> str:
    source = value.encode("utf-8")
    target = ctypes.create_string_buffer(16)
    lib.core_copy_name(target, len(source) + 1, source, len(source))
    return target.value.decode("utf-8", "replace")
