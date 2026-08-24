import { HttpErrorResponse } from '@angular/common/http';

export function errorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
  const body = error.error as { errors?: Record<string, string[]>; detail?: string; message?: string; title?: string } | null;
  const validation = body?.errors && Object.values(body.errors).flat().find(Boolean);
  return validation ?? body?.detail ?? body?.message ?? body?.title ?? 'Yêu cầu không thể hoàn tất. Vui lòng thử lại.';
}
