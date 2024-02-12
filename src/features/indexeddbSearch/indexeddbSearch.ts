import Dexie from "dexie";

class FullTextSearchDatabase extends Dexie {
  indexedObject!: Dexie.Table<IndexedObject<User>, string>;
  wordIndex!: Dexie.Table<WordIndex, string>;

  constructor() {
    super("FullTextSearchDatabase");

    this.version(1).stores({
      indexedObject: "&id, *__words",
      wordIndex: "&word, *__parts",
    });
  }
}

export type IndexedObject<T> = T & {
  __words: string[];
};

export type WordIndex = {
  word: string;
  __parts: string[];
};

export type User = {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  note: string;
};

function getWords(str: string): string[] {
  return str.toLowerCase().split(/\s+/gm);
}

function extractUserWords(user: User): Set<string> {
  return new Set([
    ...getWords(user.name),
    ...getWords(user.address),
    ...getWords(user.phoneNumber),
    ...getWords(user.note),
  ]);
}

function getWordParts(word: string): string[] {
  const parts = new Array<string>();
  for (let i = 0; i < word.length; i++) {
    parts.push(word.substring(i));
  }

  return parts;
}

function doesUserHaveTerm(user: User, term: string) {
  term = term.toLowerCase();

  return (
    user.name.toLowerCase().includes(term) ||
    user.address.toLowerCase().includes(term) ||
    user.phoneNumber.toLowerCase().includes(term) ||
    user.note.toLocaleLowerCase().includes(term)
  );
}

export class SearchSet {
  constructor(private db = new FullTextSearchDatabase()) {}

  async ingest(...users: User[]) {
    const indexedObjectBulk = new Array<IndexedObject<User>>();
    const wordIndexToBulkMap = new Map<string, WordIndex>();

    users.forEach((user) => {
      const words = extractUserWords(user);

      indexedObjectBulk.push({
        ...user,
        __words: [...words],
      });

      for (const word of words) {
        if (wordIndexToBulkMap.has(word)) {
          continue;
        }

        wordIndexToBulkMap.set(word, {
          word,
          __parts: getWordParts(word),
        });
      }
    });

    await this.db.transaction(
      "rw",
      this.db.wordIndex,
      this.db.indexedObject,
      async () => {
        await Promise.all([
          this.db.indexedObject.bulkPut(indexedObjectBulk),
          this.db.wordIndex.bulkPut([...wordIndexToBulkMap.values()]),
        ]);
      },
    );
  }

  async searchStartsWith(term: string): Promise<User[]> {
    if (term.length < 3) {
      return [];
    }

    const lowerCaseTerm = term.toLowerCase();
    const termWords = getWords(lowerCaseTerm);

    return await this.db.indexedObject
      .where("__words")
      .startsWithAnyOf(termWords)
      .distinct()
      .filter((u) => doesUserHaveTerm(u, term))
      .toArray();
  }

  async searchContains(term: string): Promise<User[]> {
    term;
    return [];
  }

  async searchContainsBrute(term: string): Promise<User[]> {
    if (term.length < 3) {
      return [];
    }

    return await this.db.indexedObject
      .filter((u) => {
        return doesUserHaveTerm(u, term);
      })
      .toArray();
  }
}
