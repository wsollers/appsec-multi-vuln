"""Command-line front end for the record tools."""

import argparse
import sys
from pathlib import Path

from .loader import describe, open_library, short_name


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(prog="c093-app")
    parser.add_argument("--library", help="path to libcore.so")
    commands = parser.add_subparsers(dest="command", required=True)
    name_command = commands.add_parser("name", help="print a shortened record name")
    name_command.add_argument("value")
    describe_command = commands.add_parser("describe", help="describe a record file")
    describe_command.add_argument("file", type=Path)
    args = parser.parse_args(argv)

    lib = open_library(args.library)
    if args.command == "name":
        print(short_name(lib, args.value))
    else:
        try:
            print(describe(lib, args.file.read_bytes()))
        except ValueError as error:
            print(error, file=sys.stderr)
            return 1
    return 0
