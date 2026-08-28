import type { RouteDraft } from './types';
import { isRouteDraft, parseBackup } from './validation';

const DB_NAME = 'route-intent-planner';
const STORE = 'routes';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRoute(route: RouteDraft): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(route);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function listRoutes(): Promise<RouteDraft[]> {
  const db = await openDb();
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

export async function deleteRoute(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function importBackup(archive: unknown): Promise<RouteDraft[]> {
  // Validate every route before opening a write transaction. A malformed
  // archive must have no partial effect, including when a later route is bad.
  const routes = parseBackup(archive);
  const db = await openDb();
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
