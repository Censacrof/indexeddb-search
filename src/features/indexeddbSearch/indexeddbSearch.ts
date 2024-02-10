import Dexie from "dexie";

class FullTextSearchDatabase extends Dexie {
  indexedObject!: Dexie.Table<IndexedObject<User>, string>;

  constructor() {
    super("FullTextSearchDatabase");

    this.version(1).stores({
      indexedObject: "&id, *__words",
    });
  }
}

export type WordIndex = {
  word: string;
  occourrences: string[];
};

export type IndexedObject<T> = T & {
  __words: string[];
};

export type User = {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
};

function tokenize(str: string): string[] {
  return str.toLowerCase().split(/\s+/gm);
}

function extractUserWords(user: User): Set<string> {
  return new Set([
    ...tokenize(user.name),
    ...tokenize(user.address),
    ...tokenize(user.phoneNumber),
  ]);
}

export class SearchSet {
  constructor(private db = new FullTextSearchDatabase()) {}

  async ingest(...users: User[]) {
    const indexedObjectBulk = new Array<IndexedObject<User>>();
    // const wordIndexBulk = new Array<IndexedObject<User>>(users.length * 10);

    users.forEach((user) => {
      const words = extractUserWords(user);

      indexedObjectBulk.push({
        ...user,
        __words: [...words],
      });
    });

    console.log({ indexedObjectBulk });
    await this.db.indexedObject.bulkPut(indexedObjectBulk);
  }

  async searchStartsWith(term: string): Promise<User[]> {
    const lowerCaseTerm = term.toLowerCase();

    return await this.db.indexedObject
      .where("__words")
      .startsWith(lowerCaseTerm)
      .distinct()
      .toArray();
  }
}
