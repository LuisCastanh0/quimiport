import type { IClock } from "../../application/ports/IClock.js";

export class SystemClock implements IClock {
  agora(): Date {
    return new Date();
  }
}
