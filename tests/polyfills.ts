// Run before tests/setup.tsx, so before react-dom is loaded: React picks its animation event names at import time.

// jsdom has no AnimationEvent: React would listen to webkit-prefixed events and animationName would be lost.
window.AnimationEvent ??= class AnimationEvent extends Event {
  readonly animationName: string;
  readonly elapsedTime: number;
  readonly pseudoElement: string;

  constructor(type: string, init: AnimationEventInit = {}) {
    super(type, init);
    this.animationName = init.animationName ?? '';
    this.elapsedTime = init.elapsedTime ?? 0;
    this.pseudoElement = init.pseudoElement ?? '';
  }
};
