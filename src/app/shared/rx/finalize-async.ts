import { finalize, MonoTypeOperatorFunction } from 'rxjs';

export function finalizeAsync<T>(cb: () => void): MonoTypeOperatorFunction<T> {
  return finalize(() => setTimeout(cb, 0));
}
