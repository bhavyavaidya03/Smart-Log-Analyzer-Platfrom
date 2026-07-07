"""
Multi-format log parsing engine.

Supports:
- Common Log Format (Apache/Nginx access logs)
- Combined Log Format (Apache/Nginx with referrer+UA)
- JSON structured logs
- Python/Django/FastAPI application logs
- Syslog format
- Custom key=value delimited logs
"""

import json
import re
from datetime import datetime, timezone
from typing import Optional

from app.models.parsed_log import LogLevel


# ── Regex Patterns ─────────────────────────────────────────────────────────────

# Common Log Format: 127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326
COMMON_LOG_PATTERN = re.compile(
    r'(?P<ip>\S+)\s+\S+\s+\S+\s+\[(?P<timestamp>[^\]]+)\]\s+'
    r'"(?P<method>\S+)\s+(?P<path>\S+)\s+\S+"\s+'
    r'(?P<status>\d{3})\s+(?P<size>\S+)'
    r'(?:\s+"(?P<referrer>[^"]*)"\s+"(?P<ua>[^"]*)")?'
    r'(?:\s+(?P<response_time>[\d.]+))?'
)

# Python/Django/FastAPI log: 2024-01-15 10:30:45,123 - myapp - ERROR - Something went wrong
PYTHON_LOG_PATTERN = re.compile(
    r'(?P<timestamp>\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}(?:[,\.]\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+'
    r'[-–]\s+(?P<source>\S+)\s+[-–]\s+(?P<level>DEBUG|INFO|WARNING|WARN|ERROR|CRITICAL|FATAL)\s+[-–]\s+'
    r'(?P<message>.+)'
)

# Log4j / logback: 2024-01-15 10:30:45.123 ERROR [myapp] com.example.Service - Message
LOG4J_PATTERN = re.compile(
    r'(?P<timestamp>\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}[.,]\d+)\s+'
    r'(?P<level>DEBUG|INFO|WARNING|WARN|ERROR|CRITICAL|FATAL)\s+'
    r'(?:\[(?P<source>[^\]]+)\]\s+)?'
    r'(?P<module>\S+)\s+-\s+'
    r'(?P<message>.+)'
)

# ISO timestamp log: [2024-01-15T10:30:45Z] [ERROR] [module] message
ISO_LOG_PATTERN = re.compile(
    r'\[(?P<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\]\s+'
    r'\[(?P<level>DEBUG|INFO|WARNING|WARN|ERROR|CRITICAL|FATAL)\]\s+'
    r'(?:\[(?P<source>[^\]]+)\]\s+)?'
    r'(?P<message>.+)'
)

# Syslog: Jan 15 10:30:45 hostname service[pid]: message
SYSLOG_PATTERN = re.compile(
    r'(?P<timestamp>[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+'
    r'(?P<host>\S+)\s+'
    r'(?P<source>\S+?)(?:\[\d+\])?:\s+'
    r'(?P<message>.+)'
)

# Uvicorn/FastAPI access: INFO:     192.168.1.1:56789 - "GET /api/v1/health HTTP/1.1" 200 OK
UVICORN_PATTERN = re.compile(
    r'(?P<level>DEBUG|INFO|WARNING|ERROR|CRITICAL):\s+'
    r'(?:(?P<ip>\d{1,3}(?:\.\d{1,3}){3}):\d+\s+-\s+)?'
    r'"(?P<method>\S+)\s+(?P<path>\S+)\s+\S+"\s+'
    r'(?P<status>\d{3})'
)

# Generic level + message: ERROR: something failed or [ERROR] something failed
GENERIC_LEVEL_PATTERN = re.compile(
    r'(?:(?P<timestamp>\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?)\s+)?'
    r'(?:\[(?P<level1>DEBUG|INFO|WARNING|WARN|ERROR|CRITICAL|FATAL)\]|'
    r'(?P<level2>DEBUG|INFO|WARNING|WARN|ERROR|CRITICAL|FATAL):)\s*'
    r'(?P<message>.+)'
)

# IP address anywhere in line
IP_PATTERN = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')

# HTTP status code anywhere in line
STATUS_PATTERN = re.compile(r'\b([1-5]\d{2})\b')

# Response time: e.g. 0.123s or 123ms
RESPONSE_TIME_PATTERN = re.compile(r'(\d+(?:\.\d+)?)\s*ms|(\d+(?:\.\d+)?)\s*s\b')


# ── Timestamp Parsing ──────────────────────────────────────────────────────────
TIMESTAMP_FORMATS = [
    "%Y-%m-%dT%H:%M:%S.%fZ",
    "%Y-%m-%dT%H:%M:%SZ",
    "%Y-%m-%dT%H:%M:%S.%f",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%d %H:%M:%S.%f",
    "%Y-%m-%d %H:%M:%S,%f",
    "%Y-%m-%d %H:%M:%S",
    "%d/%b/%Y:%H:%M:%S %z",
    "%b %d %H:%M:%S",
    "%b  %d %H:%M:%S",
]


def parse_timestamp(raw: str) -> Optional[datetime]:
    """Attempt to parse a timestamp string into a timezone-aware datetime."""
    if not raw:
        return None
    raw = raw.strip()
    # Remove trailing timezone offset in +HH:MM or -HH:MM format if we can handle it
    for fmt in TIMESTAMP_FORMATS:
        try:
            dt = datetime.strptime(raw, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            continue
    return None


def normalize_level(raw_level: str) -> LogLevel:
    """Normalize various level strings to the LogLevel enum."""
    mapping = {
        "DEBUG": LogLevel.DEBUG,
        "INFO": LogLevel.INFO,
        "INFORMATION": LogLevel.INFO,
        "WARNING": LogLevel.WARNING,
        "WARN": LogLevel.WARNING,
        "ERROR": LogLevel.ERROR,
        "ERR": LogLevel.ERROR,
        "CRITICAL": LogLevel.CRITICAL,
        "FATAL": LogLevel.CRITICAL,
        "SEVERE": LogLevel.CRITICAL,
    }
    return mapping.get(raw_level.upper(), LogLevel.UNKNOWN)


def extract_ip(text: str) -> Optional[str]:
    """Extract first valid IP address from text."""
    match = IP_PATTERN.search(text)
    return match.group(0) if match else None


def extract_response_time(text: str) -> Optional[float]:
    """Extract response time in milliseconds."""
    match = RESPONSE_TIME_PATTERN.search(text)
    if match:
        if match.group(1):  # ms
            return float(match.group(1))
        if match.group(2):  # s -> ms
            return float(match.group(2)) * 1000
    return None


# ── Parsers ────────────────────────────────────────────────────────────────────

def parse_json_log(line: str) -> Optional[dict]:
    """Try to parse a JSON log line."""
    try:
        data = json.loads(line.strip())
        if not isinstance(data, dict):
            return None

        # Normalize common JSON log field names
        level_raw = (
            data.get("level") or data.get("severity") or
            data.get("log_level") or data.get("levelname") or ""
        )
        message = (
            data.get("message") or data.get("msg") or
            data.get("text") or str(data)
        )
        timestamp_raw = (
            data.get("timestamp") or data.get("time") or
            data.get("@timestamp") or data.get("date") or ""
        )
        source = data.get("logger") or data.get("name") or data.get("service")
        module = data.get("module") or data.get("filename")
        ip = data.get("ip") or data.get("remote_addr") or data.get("client_ip")
        status = data.get("status") or data.get("status_code") or data.get("http_status")
        rt = data.get("response_time") or data.get("duration") or data.get("elapsed")

        return {
            "timestamp": parse_timestamp(str(timestamp_raw)) if timestamp_raw else None,
            "level": normalize_level(str(level_raw)) if level_raw else LogLevel.UNKNOWN,
            "source": str(source) if source else None,
            "module": str(module) if module else None,
            "ip_address": str(ip) if ip else None,
            "status_code": int(status) if status else None,
            "response_time": float(rt) if rt else None,
            "message": str(message),
        }
    except (json.JSONDecodeError, ValueError, TypeError):
        return None


def parse_common_log(line: str) -> Optional[dict]:
    m = COMMON_LOG_PATTERN.match(line.strip())
    if not m:
        return None
    return {
        "timestamp": parse_timestamp(m.group("timestamp")),
        "level": LogLevel.INFO,
        "source": "access",
        "module": None,
        "ip_address": m.group("ip"),
        "status_code": int(m.group("status")),
        "response_time": float(m.group("response_time")) * 1000 if m.group("response_time") else None,
        "message": f'{m.group("method")} {m.group("path")} {m.group("status")}',
    }


def parse_python_log(line: str) -> Optional[dict]:
    m = PYTHON_LOG_PATTERN.match(line.strip())
    if not m:
        return None
    return {
        "timestamp": parse_timestamp(m.group("timestamp")),
        "level": normalize_level(m.group("level")),
        "source": m.group("source"),
        "module": None,
        "ip_address": extract_ip(m.group("message")),
        "status_code": None,
        "response_time": extract_response_time(m.group("message")),
        "message": m.group("message").strip(),
    }


def parse_log4j(line: str) -> Optional[dict]:
    m = LOG4J_PATTERN.match(line.strip())
    if not m:
        return None
    return {
        "timestamp": parse_timestamp(m.group("timestamp")),
        "level": normalize_level(m.group("level")),
        "source": m.group("source"),
        "module": m.group("module"),
        "ip_address": extract_ip(m.group("message")),
        "status_code": None,
        "response_time": extract_response_time(m.group("message")),
        "message": m.group("message").strip(),
    }


def parse_iso_log(line: str) -> Optional[dict]:
    m = ISO_LOG_PATTERN.match(line.strip())
    if not m:
        return None
    return {
        "timestamp": parse_timestamp(m.group("timestamp")),
        "level": normalize_level(m.group("level")),
        "source": m.group("source"),
        "module": None,
        "ip_address": extract_ip(m.group("message")),
        "status_code": None,
        "response_time": extract_response_time(m.group("message")),
        "message": m.group("message").strip(),
    }


def parse_syslog(line: str) -> Optional[dict]:
    m = SYSLOG_PATTERN.match(line.strip())
    if not m:
        return None
    return {
        "timestamp": parse_timestamp(m.group("timestamp")),
        "level": LogLevel.INFO,
        "source": m.group("source"),
        "module": m.group("host"),
        "ip_address": None,
        "status_code": None,
        "response_time": None,
        "message": m.group("message").strip(),
    }


def parse_uvicorn(line: str) -> Optional[dict]:
    m = UVICORN_PATTERN.match(line.strip())
    if not m:
        return None
    return {
        "timestamp": None,
        "level": normalize_level(m.group("level")),
        "source": "uvicorn",
        "module": None,
        "ip_address": m.group("ip"),
        "status_code": int(m.group("status")),
        "response_time": None,
        "message": f'{m.group("method")} {m.group("path")} {m.group("status")}',
    }


def parse_generic_level(line: str) -> Optional[dict]:
    m = GENERIC_LEVEL_PATTERN.match(line.strip())
    if not m:
        return None
    level_str = m.group("level1") or m.group("level2") or "UNKNOWN"
    return {
        "timestamp": parse_timestamp(m.group("timestamp")) if m.group("timestamp") else None,
        "level": normalize_level(level_str),
        "source": None,
        "module": None,
        "ip_address": extract_ip(m.group("message")),
        "status_code": None,
        "response_time": extract_response_time(m.group("message")),
        "message": m.group("message").strip(),
    }


# ── Main Parser ────────────────────────────────────────────────────────────────

PARSERS = [
    parse_json_log,
    parse_common_log,
    parse_python_log,
    parse_log4j,
    parse_iso_log,
    parse_uvicorn,
    parse_syslog,
    parse_generic_level,
]


def parse_log_line(line: str, line_number: int, upload_id: str) -> dict:
    """
    Try each parser in order. Return the first successful parse.
    Falls back to a raw message with UNKNOWN level.
    """
    stripped = line.strip()
    if not stripped:
        return None  # skip empty lines

    for parser in PARSERS:
        result = parser(stripped)
        if result:
            result["upload_id"] = upload_id
            result["raw_line"] = stripped
            result["line_number"] = line_number
            # Ensure level is always a LogLevel enum value
            if not isinstance(result.get("level"), LogLevel):
                result["level"] = LogLevel.UNKNOWN
            return result

    # Fallback: raw line with unknown level
    return {
        "upload_id": upload_id,
        "timestamp": None,
        "level": LogLevel.UNKNOWN,
        "source": None,
        "module": None,
        "ip_address": extract_ip(stripped),
        "status_code": None,
        "response_time": None,
        "message": stripped,
        "raw_line": stripped,
        "line_number": line_number,
    }


def parse_log_file_content(content: str, upload_id: str) -> tuple[list[dict], int, int]:
    """
    Parse all lines in a log file content string.
    Returns: (parsed_entries, total_lines, successfully_parsed)
    """
    lines = content.splitlines()
    total_lines = len(lines)
    entries = []

    for i, line in enumerate(lines, start=1):
        result = parse_log_line(line, i, upload_id)
        if result is not None:
            entries.append(result)

    return entries, total_lines, len(entries)
