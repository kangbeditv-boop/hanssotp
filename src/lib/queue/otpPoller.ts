interface OtpPollerJob {
  orderId: string;
  activationId: string;
  userId: string;
  startedAt: number;
}

const activeJobs = new Map<string, NodeJS.Timeout>();
const MAX_POLL_DURATION = 5 * 60 * 1000;
const POLL_INTERVAL = 5000;

export function startOtpPolling(
  job: OtpPollerJob,
  checkFn: (activationId: string) => Promise<{ status: string; sms_code: string | null }>,
  onReceived: (orderId: string, code: string) => void,
  onExpired: (orderId: string) => void
) {
  if (activeJobs.has(job.orderId)) return;

  const timer = setInterval(async () => {
    const elapsed = Date.now() - job.startedAt;
    if (elapsed >= MAX_POLL_DURATION) {
      stopOtpPolling(job.orderId);
      onExpired(job.orderId);
      return;
    }
    try {
      const result = await checkFn(job.activationId);
      if (result.status === "received" && result.sms_code) {
        stopOtpPolling(job.orderId);
        onReceived(job.orderId, result.sms_code);
      } else if (result.status === "cancelled" || result.status === "expired") {
        stopOtpPolling(job.orderId);
        onExpired(job.orderId);
      }
    } catch (error) {
      console.error(`[OtpPoller] Error polling ${job.orderId}:`, error);
    }
  }, POLL_INTERVAL);

  activeJobs.set(job.orderId, timer);
}

export function stopOtpPolling(orderId: string) {
  const timer = activeJobs.get(orderId);
  if (timer) {
    clearInterval(timer);
    activeJobs.delete(orderId);
  }
}

export function getActivePollingCount(): number {
  return activeJobs.size;
}
