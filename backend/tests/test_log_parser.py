"""Tests for log parsing utility."""

import pytest
from app.utils.log_parser import parse_log_line, parse_log_file_content
from app.models.parsed_log import LogLevel


def test_parse_python_log():
    line = "2024-01-15 10:30:45,123 - myapp - ERROR - Database connection failed"
    result = parse_log_line(line, 1, "test-upload-id")
    assert result is not None
    assert result["level"] == LogLevel.ERROR
    assert "Database connection failed" in result["message"]
    assert result["source"] == "myapp"


def test_parse_json_log():
    line = '{"timestamp": "2024-01-15T10:30:45Z", "level": "INFO", "message": "Request processed", "service": "api"}'
    result = parse_log_line(line, 1, "test-upload-id")
    assert result is not None
    assert result["level"] == LogLevel.INFO
    assert result["message"] == "Request processed"


def test_parse_common_log():
    line = '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326'
    result = parse_log_line(line, 1, "test-upload-id")
    assert result is not None
    assert result["ip_address"] == "127.0.0.1"
    assert result["status_code"] == 200


def test_parse_empty_line():
    result = parse_log_line("", 1, "test-upload-id")
    assert result is None


def test_parse_file_content():
    content = """2024-01-15 10:30:45,123 - app - ERROR - Something broke
2024-01-15 10:30:46,456 - app - INFO - Starting up
2024-01-15 10:30:47,789 - app - WARNING - Low memory"""
    entries, total, parsed = parse_log_file_content(content, "test-id")
    assert total == 3
    assert parsed == 3
    assert entries[0]["level"] == LogLevel.ERROR
    assert entries[1]["level"] == LogLevel.INFO
    assert entries[2]["level"] == LogLevel.WARNING
