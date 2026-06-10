import { describe, expect, it } from "vitest";
import {
  DEFAULT_ASR_CHUNK_OVERLAP_SECONDS,
  buildOverlappedChunkPlan,
  estimateSafeChunkSeconds,
  mergePlaintextChunkRows,
  mergeTimestampedChunkRows
} from "../utils/asrChunking.js";

describe("asrChunking", () => {
  it("builds overlapped chunk plans", () => {
    expect(buildOverlappedChunkPlan(1300, 600, 4)).toEqual([
      { index: 0, startSec: 0, durationSec: 600, endSec: 600 },
      { index: 1, startSec: 596, durationSec: 600, endSec: 1196 },
      { index: 2, startSec: 1192, durationSec: 108, endSec: 1300 }
    ]);
  });

  it("estimates chunk size conservatively from bitrate", () => {
    expect(estimateSafeChunkSeconds(24 * 1024 * 1024, 600, 24 * 1024 * 1024)).toBeLessThan(600);
    expect(estimateSafeChunkSeconds(12 * 1024 * 1024, 1200, 24 * 1024 * 1024)).toBe(600);
  });

  it("merges overlapped rows by trimming duplicated lead-in", () => {
    const merged = mergeTimestampedChunkRows(
      [{ start: 0, end: 3, text: "第一句", index: 0 }],
      [
        { start: 0, end: 2, text: "重复头部", index: 0 },
        { start: 3.5, end: 8, text: "第二句", index: 1 }
      ],
      596,
      DEFAULT_ASR_CHUNK_OVERLAP_SECONDS
    );

    expect(merged).toEqual([
      { start: 0, end: 3, text: "第一句", index: 0 },
      { start: 600, end: 604, text: "第二句", index: 1 }
    ]);
  });

  it("merges plaintext chunk rows by removing duplicated overlap sentences", () => {
    const merged = mergePlaintextChunkRows(
      [
        { text: "大家好，今天讲第一部分。", index: 0, noTimestamp: true },
        { text: "接下来进入重点。", index: 1, noTimestamp: true }
      ],
      [
        { text: "接下来进入重点。", index: 0, noTimestamp: true },
        { text: "这里是新的内容。", index: 1, noTimestamp: true }
      ]
    );

    expect(merged).toEqual([
      { text: "大家好，今天讲第一部分。", index: 0, noTimestamp: true },
      { text: "接下来进入重点。", index: 1, noTimestamp: true },
      { start: null, end: null, text: "这里是新的内容。", index: 2, noTimestamp: true }
    ]);
  });
});
