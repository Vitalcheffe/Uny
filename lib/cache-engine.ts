/**
 * ⚡ UNY PROTOCOL: CACHE ENGINE (V1)
 * Description: Couche de cache local utilisant IndexedDB pour la navigation instantanée.
 * Optimisé pour les connexions instables (Africa-Ready).
 */

import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'uny_protocol_cache';
const DB_VERSION = 1;
const STORE_DOCUMENTS = 'documents_metadata';

interface DocumentMetadata {
  id: string;
  name: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  file_type: string;
  size: number;
  author_id: string;
  tags?: string[];
}

class CacheEngine {
  private db: Promise<IDBPDatabase>;

  constructor() {
    this.db = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
          db.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
        }
      },
    });
  }

  /**
   * Sauvegarde une liste de métadonnées de documents dans le cache.
   */
  async cacheDocuments(documents: DocumentMetadata[]): Promise<void> {
    const db = await this.db;
    const tx = db.transaction(STORE_DOCUMENTS, 'readwrite');
    const store = tx.objectStore(STORE_DOCUMENTS);
    
    // On vide l'ancien cache pour cette organisation (simplification)
    // En production, on ferait un merge intelligent.
    await store.clear();
    
    for (const doc of documents) {
      await store.put(doc);
    }
    
    await tx.done;
    console.log(`⚡ [CacheEngine] ${documents.length} documents mis en cache.`);
  }

  /**
   * Récupère les documents du cache local.
   */
  async getCachedDocuments(): Promise<DocumentMetadata[]> {
    const db = await this.db;
    return db.getAll(STORE_DOCUMENTS);
  }

  /**
   * Vide tout le cache local.
   */
  async clearAll(): Promise<void> {
    const db = await this.db;
    const tx = db.transaction(STORE_DOCUMENTS, 'readwrite');
    await tx.objectStore(STORE_DOCUMENTS).clear();
    await tx.done;
    console.log('⚡ [CacheEngine] Cache vidé.');
  }
}

export const cacheEngine = new CacheEngine();
