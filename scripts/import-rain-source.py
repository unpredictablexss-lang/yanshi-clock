"""Download and turn a CC0 field recording into a compact, gentle rain loop."""
from __future__ import annotations

import argparse
import array
import math
import pathlib
import struct
import sys
import tempfile
import urllib.request


SOURCE_URL = (
    "https://upload.wikimedia.org/wikipedia/commons/b/b6/"
    "Light_Rain_Distant_Thunder_July_5th_2016.wav"
)
TARGET_RATE = 11025
TARGET_SECONDS = 18


def read_wave_layout(path: pathlib.Path) -> dict:
    with path.open("rb") as stream:
        if stream.read(4) != b"RIFF":
            raise ValueError("source is not a RIFF file")
        stream.seek(8)
        if stream.read(4) != b"WAVE":
            raise ValueError("source is not a WAVE file")
        fmt = None
        data_offset = data_size = None
        while True:
            header = stream.read(8)
            if len(header) < 8:
                break
            chunk_id, size = struct.unpack("<4sI", header)
            offset = stream.tell()
            if chunk_id == b"fmt ":
                raw = stream.read(size)
                fmt = struct.unpack("<HHIIHH", raw[:16])
            elif chunk_id == b"data":
                data_offset, data_size = offset, size
                stream.seek(size, 1)
            else:
                stream.seek(size, 1)
            if size % 2:
                stream.seek(1, 1)
        if not fmt or data_offset is None:
            raise ValueError("missing WAV fmt/data chunk")
        format_tag, channels, rate, _, block_align, bits = fmt
        if format_tag != 3 or bits != 32:
            raise ValueError(f"expected 32-bit float WAV, got format={format_tag}, bits={bits}")
        return {
            "channels": channels,
            "rate": rate,
            "block_align": block_align,
            "data_offset": data_offset,
            "data_size": data_size,
            "frames": data_size // block_align,
        }


def floats_from_bytes(raw: bytes) -> array.array:
    values = array.array("f")
    values.frombytes(raw)
    if sys.byteorder != "little":
        values.byteswap()
    return values


def analyze_seconds(path: pathlib.Path, layout: dict) -> list[dict]:
    metrics = []
    frames_per_block = layout["rate"]
    bytes_per_block = frames_per_block * layout["block_align"]
    with path.open("rb") as stream:
        stream.seek(layout["data_offset"])
        remaining = layout["data_size"]
        while remaining > 0:
            raw = stream.read(min(bytes_per_block, remaining))
            remaining -= len(raw)
            values = floats_from_bytes(raw)
            count = len(values) // layout["channels"]
            if not count:
                break
            energy = peak = 0.0
            for pos in range(0, count * layout["channels"], layout["channels"]):
                mono = sum(values[pos:pos + layout["channels"]]) / layout["channels"]
                energy += mono * mono
                peak = max(peak, abs(mono))
            metrics.append({"rms": math.sqrt(energy / count), "peak": peak})
    return metrics


def pick_gentle_window(metrics: list[dict], seconds: int) -> int:
    best = None
    for start in range(4, max(5, len(metrics) - seconds - 4)):
        window = metrics[start:start + seconds]
        if len(window) < seconds:
            continue
        mean = sum(item["rms"] for item in window) / seconds
        variance = sum((item["rms"] - mean) ** 2 for item in window) / seconds
        peak = max(item["peak"] for item in window)
        # 排除接近静音和可能含响雷/近距离大雨滴的片段。
        if mean < 0.002 or peak > 0.72:
            continue
        score = mean + math.sqrt(variance) * 1.8 + peak * 0.035
        if best is None or score < best[0]:
            best = (score, start, mean, peak)
    if best is None:
        raise ValueError("could not find a suitable gentle-rain window")
    print(f"selected source segment {best[1]}s–{best[1] + seconds}s "
          f"(rms={best[2]:.4f}, peak={best[3]:.4f})")
    return best[1]


def read_mono_segment(path: pathlib.Path, layout: dict, start: int, seconds: int) -> list[float]:
    frame_count = min(seconds * layout["rate"], layout["frames"] - start * layout["rate"])
    with path.open("rb") as stream:
        stream.seek(layout["data_offset"] + start * layout["rate"] * layout["block_align"])
        values = floats_from_bytes(stream.read(frame_count * layout["block_align"]))
    channels = layout["channels"]
    return [sum(values[pos:pos + channels]) / channels for pos in range(0, len(values), channels)]


def resample_and_soften(samples: list[float], source_rate: int) -> list[float]:
    output_count = int(len(samples) * TARGET_RATE / source_rate)
    output = []
    low_pass = 0.0
    for index in range(output_count):
        source_pos = index * source_rate / TARGET_RATE
        left = min(int(source_pos), len(samples) - 1)
        right = min(left + 1, len(samples) - 1)
        fraction = source_pos - left
        value = samples[left] * (1 - fraction) + samples[right] * fraction
        # 适度削弱密集的高频雨点，保留窗外细雨的连续底噪。
        low_pass += 0.22 * (value - low_pass)
        output.append(low_pass)

    mean = sum(output) / len(output)
    output = [value - mean for value in output]
    base_rms = math.sqrt(sum(value * value for value in output) / len(output)) or 1
    # 柔性压低少数近距离雨滴，避免它们抬高峰值导致整体太轻。
    soft_limit = max(base_rms * 4, 0.005)
    output = [math.tanh(value / soft_limit) * soft_limit for value in output]
    rms = math.sqrt(sum(value * value for value in output) / len(output)) or 1
    gain = min(0.036 / rms, 0.3 / max(abs(value) for value in output))
    edge = int(TARGET_RATE * 0.12)
    for index, value in enumerate(output):
        envelope = 1.0
        if index < edge:
            envelope = math.sin(index / edge * math.pi / 2)
        elif index >= len(output) - edge:
            envelope = math.sin((len(output) - 1 - index) / edge * math.pi / 2)
        output[index] = max(-1.0, min(1.0, value * gain * envelope))
    return output


def write_pcm16(path: pathlib.Path, samples: list[float]) -> None:
    data = array.array("h", (round(value * 32767) for value in samples))
    if sys.byteorder != "little":
        data.byteswap()
    payload = data.tobytes()
    header = (
        b"RIFF" + struct.pack("<I", 36 + len(payload)) + b"WAVE"
        + b"fmt " + struct.pack("<IHHIIHH", 16, 1, 1, TARGET_RATE, TARGET_RATE * 2, 2, 16)
        + b"data" + struct.pack("<I", len(payload))
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(header + payload)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=pathlib.Path)
    parser.add_argument("--output", type=pathlib.Path)
    args = parser.parse_args()
    root = pathlib.Path(__file__).resolve().parents[1]
    output = args.output or root.parent / "音频源文件备份" / "rain-window.wav"
    source = args.source or pathlib.Path(tempfile.gettempdir()) / "yanshi-rain-source" / "light-rain-source.wav"
    if not source.exists():
        source.parent.mkdir(parents=True, exist_ok=True)
        print("downloading CC0 source recording...")
        urllib.request.urlretrieve(SOURCE_URL, source)
    layout = read_wave_layout(source)
    metrics = analyze_seconds(source, layout)
    start = pick_gentle_window(metrics, TARGET_SECONDS)
    samples = read_mono_segment(source, layout, start, TARGET_SECONDS)
    processed = resample_and_soften(samples, layout["rate"])
    write_pcm16(output, processed)
    print(f"wrote {output} ({output.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
