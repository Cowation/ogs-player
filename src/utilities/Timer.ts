/**
 * Used internally to determine when lyrics are synced.
 */
export default class Timer {
  t: number;
  fn: () => unknown;

  timer: NodeJS.Timeout | undefined | null;
  tRemaining: number;
  tStarted: number | undefined;

  constructor(fn: () => unknown, t: number) {
    this.t = t;
    this.fn = fn;
    this.tRemaining = t;

    this.resume();
  }

  resume() {
    if (!this.timer) {
      this.tStarted = new Date().getTime();
      this.timer = setTimeout(this.fn, this.tRemaining);
    }
  }
  
  pause() {
    if (this.timer && this.tStarted) {
      clearTimeout(this.timer);
      this.timer = null;

      const now = new Date().getTime();
      this.tRemaining -= now - this.tStarted;
    }
  }
}