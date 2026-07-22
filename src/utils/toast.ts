// src/utils/toast.ts
export const showToastGlobal = (message: string, type: "success" | "error" = "success") => {
  if (window.showToast) {
    window.showToast(message, type);
  }
};