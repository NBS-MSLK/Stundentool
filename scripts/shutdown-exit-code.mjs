// Next.js exits with 128 + signal number after its graceful shutdown.
// Preserve real failures so Railway can still report crashes.
export function shutdownExitCode(code, signal) {
  if (signal === 'SIGTERM' || signal === 'SIGINT' || code === 143 || code === 130) return 0;
  return code ?? 1;
}
