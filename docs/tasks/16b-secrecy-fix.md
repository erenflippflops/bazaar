# Task 16b - Fix Flaky Secrecy Test

## Goal
Fix secrecy test timing issue by comparing message order instead of timestamps.

## Files you may change
- tests/integration/secrecy.test.ts

## Auditor

### The Problem
The test compares timestamps but socket messages can arrive in the same millisecond or out of order due to async processing. This causes flaky failures like:
```
expected 1791027309252 to be less than or equal to 1791027309251
```

### The Fix
Instead of comparing timestamps, track the ORDER messages arrive and verify:
1. An item name never appears in ANY message before the wheel_spun event for that item
2. Use message sequence numbers or array indices, not timestamps

Rewrite the test to:
- Collect all messages in order with sequence numbers
- For each item, find the sequence number when it was revealed (wheel_spun event)
- Check that the item name never appears in messages with lower sequence numbers

This makes the test deterministic and not dependent on millisecond-precision timing.

## Commit message
- "Task 16b: Fix secrecy test to use message order not timestamps"

## Report
Confirm the test passes consistently (run 3 times).
