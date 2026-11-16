#!/usr/bin/env python3
"""Preview the site locally with byte-range support for seekable MP4 playback.

Run ``python serve.py`` from any directory, then open http://127.0.0.1:8765/.
Like Python's standard http.server, this is a development server, not hosting.
"""

import argparse
import datetime
import email.utils
import os
import re
import urllib.parse
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class RangeRequestHandler(SimpleHTTPRequestHandler):
    """Serve regular files and a single HTTP byte range using bounded reads."""

    protocol_version = "HTTP/1.1"
    _remaining = None

    @staticmethod
    def _date_is_current(value, modified):
        try:
            date = email.utils.parsedate_to_datetime(value)
            if date.tzinfo is None:
                date = date.replace(tzinfo=datetime.timezone.utc)
            return int(modified) <= date.timestamp()
        except (TypeError, ValueError, IndexError, OverflowError, OSError):
            return False

    @staticmethod
    def _parse_range(value, size):
        """Return inclusive byte bounds; reject invalid/unsatisfiable ranges."""
        match = re.fullmatch(r"bytes=(\d*)-(\d*)", value.strip())
        if not match or not any(match.groups()) or size == 0:
            raise ValueError("Invalid or unsatisfiable byte range")
        first, last = match.groups()
        if first:
            start = int(first)
            end = int(last) if last else size - 1
            if start >= size or end < start:
                raise ValueError("Unsatisfiable byte range")
            return start, min(end, size - 1)
        suffix_length = int(last)
        if suffix_length <= 0:
            raise ValueError("Unsatisfiable suffix range")
        return max(0, size - suffix_length), size - 1

    def send_head(self):
        self._remaining = None
        # Keep the standard handler's path normalization and directory behavior.
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            parts = urllib.parse.urlsplit(self.path)
            if not parts.path.endswith("/"):
                self.send_response(HTTPStatus.MOVED_PERMANENTLY)
                location = urllib.parse.urlunsplit(
                    (parts.scheme, parts.netloc, parts.path + "/", parts.query, parts.fragment)
                )
                self.send_header("Location", location)
                self.send_header("Content-Length", "0")
                self.end_headers()
                return None
            for name in ("index.html", "index.htm"):
                candidate = os.path.join(path, name)
                if os.path.isfile(candidate):
                    path = candidate
                    break
            else:
                return self.list_directory(path)
        if path.endswith("/"):
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return None
        try:
            source = open(path, "rb")
        except OSError:
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return None
        try:
            stat = os.fstat(source.fileno())
            modified = stat.st_mtime
            if (
                "If-Modified-Since" in self.headers
                and "If-None-Match" not in self.headers
                and self._date_is_current(self.headers["If-Modified-Since"], modified)
            ):
                self.send_response(HTTPStatus.NOT_MODIFIED)
                self.send_header("Accept-Ranges", "bytes")
                self.end_headers()
                source.close()
                return None

            requested = self.headers.get("Range")
            if_range = self.headers.get("If-Range")
            if if_range and not self._date_is_current(if_range, modified):
                requested = None
            # Multiple ranges and unknown units can be ignored per HTTP semantics.
            if requested and ("," in requested or not requested.startswith("bytes=")):
                requested = None
            bounds = None
            if requested:
                try:
                    bounds = self._parse_range(requested, stat.st_size)
                except ValueError:
                    self.send_response(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    self.send_header("Accept-Ranges", "bytes")
                    self.send_header("Content-Range", f"bytes */{stat.st_size}")
                    self.send_header("Content-Length", "0")
                    self.end_headers()
                    source.close()
                    return None

            self.send_response(HTTPStatus.PARTIAL_CONTENT if bounds else HTTPStatus.OK)
            self.send_header("Content-Type", self.guess_type(path))
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Last-Modified", self.date_time_string(modified))
            if bounds:
                start, end = bounds
                source.seek(start)
                self._remaining = end - start + 1
                self.send_header("Content-Range", f"bytes {start}-{end}/{stat.st_size}")
                self.send_header("Content-Length", str(self._remaining))
            else:
                self.send_header("Content-Length", str(stat.st_size))
            self.end_headers()
            return source
        except Exception:
            source.close()
            raise

    def copyfile(self, source, outputfile):
        try:
            if self._remaining is None:
                return super().copyfile(source, outputfile)
            remaining = self._remaining
            while remaining:
                chunk = source.read(min(64 * 1024, remaining))
                if not chunk:
                    self.close_connection = True
                    break
                outputfile.write(chunk)
                remaining -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            # Browsers cancel outstanding requests when the user seeks again.
            self.close_connection = True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bind", default="127.0.0.1", help="Bind address (default: loopback only)")
    parser.add_argument("--port", type=int, default=8765, help="HTTP port (default: 8765)")
    parser.add_argument("--directory", type=Path, default=Path(__file__).resolve().parent)
    args = parser.parse_args()
    if not args.directory.is_dir():
        parser.error(f"Directory does not exist: {args.directory}")
    if not 0 <= args.port <= 65535:
        parser.error("Port must be between 0 and 65535")
    handler = partial(RangeRequestHandler, directory=str(args.directory.resolve()))
    with ThreadingHTTPServer((args.bind, args.port), handler) as server:
        print(f"Serving {args.directory.resolve()} at http://{args.bind}:{server.server_port}/", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
