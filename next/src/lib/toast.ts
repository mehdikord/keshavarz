import { toast as sonnerToast } from "sonner";

const TOAST_DURATION_MS = 3_000;

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, { description, duration: TOAST_DURATION_MS });
  },
  error: (message: string, description?: string) => {
    sonnerToast.error(message, { description, duration: TOAST_DURATION_MS });
  },
  info: (message: string, description?: string) => {
    sonnerToast.info(message, { description, duration: TOAST_DURATION_MS });
  },
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, { description, duration: TOAST_DURATION_MS });
  },
};
