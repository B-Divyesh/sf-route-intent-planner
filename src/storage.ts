import type { RouteDraft } from './types';
import { isRouteDraft, parseBackup } from './validation';

export type StorageScope = 'real' | 'demo';

const databaseName = (scope: StorageScope) => scope === 'demo' ? 'demo:route-intent-planner' : 'route-intent-planner';
const STORE = 'routes';

function openDb(scope: StorageScope): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName(scope), 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRoute(route: RouteDraft, scope: StorageScope = 'real'): Promise<void> {
  const db = await openDb(scope);
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(route);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function listRoutes(scope: StorageScope = 'real'): Promise<RouteDraft[]> {
  const db = await openDb(scope);
  const routes = await new Promise<RouteDraft[]>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    const request = store.getAll();
    let valid: RouteDraft[] = [];
    request.onsuccess = () => {
      valid = request.result.filter(isRouteDraft);
      // Candidate builds could have written malformed data. Remove only those
      // records so valid local routes remain usable instead of crashing render.
      request.result.filter((route: unknown) => !isRouteDraft(route)).forEach((route: unknown) => {
        if (route && typeof route === 'object' && typeof (route as { id?: unknown }).id === 'string') store.delete((route as { id: string }).id);
      });
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve(valid);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  db.close();
  return routes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteRoute(id: string, scope: StorageScope = 'real'): Promise<void> {
  const db = await openDb(scope);
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function importBackup(archive: unknown, scope: StorageScope = 'real'): Promise<RouteDraft[]> {
  // Validate every route before opening a write transaction. A malformed
  // archive must have no partial effect, including when a later route is bad.
  const routes = parseBackup(archive);
  const db = await openDb(scope);
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    routes.forEach((route) => store.put(route));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  db.close();
  return routes;
}

export function clearRoutes(scope: StorageScope): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName(scope));
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Close other demo tabs before resetting the sample.'));
  });
}
