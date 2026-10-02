export interface TimerState {
  openingTimer: NodeJS.Timeout | null;
  auctionEndTime: number | null;
  auctionTimer: NodeJS.Timeout | null;
  openingEndTime: number | null;
}

export function createTimerState(): TimerState {
  return {
    openingTimer: null,
    auctionEndTime: null,
    auctionTimer: null,
    openingEndTime: null
  };
}

export function clearAllTimers(timers: TimerState): void {
  if (timers.openingTimer) {
    clearTimeout(timers.openingTimer);
    timers.openingTimer = null;
  }
  if (timers.auctionTimer) {
    clearTimeout(timers.auctionTimer);
    timers.auctionTimer = null;
  }
  timers.auctionEndTime = null;
  timers.openingEndTime = null;
}

export function clearOpeningTimer(timers: TimerState): void {
  if (timers.openingTimer) {
    clearTimeout(timers.openingTimer);
    timers.openingTimer = null;
  }
  timers.openingEndTime = null;
}

export function clearAuctionTimer(timers: TimerState): void {
  if (timers.auctionTimer) {
    clearTimeout(timers.auctionTimer);
    timers.auctionTimer = null;
  }
  timers.auctionEndTime = null;
}

export function scheduleAuctionEnd(
  timers: TimerState,
  delay: number,
  callback: () => void
): void {
  clearAuctionTimer(timers);
  timers.auctionEndTime = Date.now() + delay;
  timers.auctionTimer = setTimeout(callback, delay);
}

export function extendAuctionIfNeeded(
  timers: TimerState,
  extensionThreshold: number,
  extensionAmount: number,
  callback: () => void
): boolean {
  if (!timers.auctionEndTime) return false;

  const remaining = timers.auctionEndTime - Date.now();
  if (remaining < extensionThreshold) {
    // Add extensionAmount to remaining time instead of resetting
    scheduleAuctionEnd(timers, remaining + extensionAmount, callback);
    return true;
  }
  return false;
}
