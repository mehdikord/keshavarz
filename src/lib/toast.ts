import { toast as sonnerToast } from "sonner";

/**
 * Sonner's built-in auto-dismiss relies on a hover/touch pause timer that
 * `pauseOnHover={false}` (which sonner 2.x does not actually read) is meant to
 * disable. In this app it can therefore be left paused forever, so a toast
 * stays on screen after navigating. We dismiss explicitly after our duration
 * to guarantee the toast always disappears.
 */
const TOAST_DURATION_MS = 3_000;

function dismissAfter(id: string | number, duration: number) {
  window.setTimeout(() => sonnerToast.dismiss(id), duration);
}

export const toast = {
  success: (message: string, description?: string) => {
    const id = sonnerToast.success(message, {
      description,
      duration: TOAST_DURATION_MS,
    });
    dismissAfter(id, TOAST_DURATION_MS);
  },
  error: (message: string, description?: string) => {
    const id = sonnerToast.error(message, {
      description,
      duration: TOAST_DURATION_MS,
    });
    dismissAfter(id, TOAST_DURATION_MS);
  },
  info: (message: string, description?: string) => {
    const id = sonnerToast.info(message, {
      description,
      duration: TOAST_DURATION_MS,
    });
    dismissAfter(id, TOAST_DURATION_MS);
  },
  warning: (message: string, description?: string) => {
    const id = sonnerToast.warning(message, {
      description,
      duration: TOAST_DURATION_MS,
    });
    dismissAfter(id, TOAST_DURATION_MS);
  },
};

/*
 * The <Toaster> mounts only after app bootstrap (inside AppProvider), and sonner
 * drops toasts raised before it subscribes. Early callers (service-worker
 * updates) queue through `whenToasterReady` instead.
 */
let toasterMounted = false;
const pendingToasts: Array<() => void> = [];

export function setToasterMounted(mounted: boolean) {
  toasterMounted = mounted;
  if (mounted) for (const show of pendingToasts.splice(0)) show();
}

export function whenToasterReady(show: () => void) {
  if (toasterMounted) show();
  else pendingToasts.push(show);
}
