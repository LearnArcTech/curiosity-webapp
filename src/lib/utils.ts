export function isMotionDisabled(): boolean {
  if (typeof document === "undefined") return false;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--motion-duration")
    .trim();
  const seconds = parseFloat(value);
  console.log(seconds);
  return seconds === 0;
}

export function motionDuration(ms: number): number {
  return isMotionDisabled() ? 0 : ms;
}

export function isSimpleMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.hasAttribute("data-simple-mode");
}
