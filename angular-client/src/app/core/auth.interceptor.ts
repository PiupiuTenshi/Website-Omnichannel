import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from './session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const token = session.validToken();
  const headers: Record<string, string> = { 'X-Cart-Session': session.cartSessionId(), 'X-Guest-Cart-Token': session.cartSessionId() };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return next(request.clone({ setHeaders: headers }));
};
