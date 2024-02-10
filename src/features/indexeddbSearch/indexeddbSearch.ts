import Dexie from "dexie";

class FullTextSearchDatabase extends Dexie {
  wordIndex!: Dexie.Table<WordIndex, string>;
  indexedObject!: Dexie.Table<IndexedObject<User>, string>;

  constructor() {
    super("FullTextSearchDatabase");

    this.version(1).stores({
      wordIndex: "&word",
      indexedObject: "&id, *words",
    });
  }
}

export type WordIndex = {
  word: string;
  occourrences: Set<string>;
};

export type IndexedObject<T> = T & {
  __words: Set<string>;
};

export type User = {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
};

function tokenize(str: string): string[] {
  return str.split(/\s+/gm);
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

  async ingest(user: User) {
    const words = extractUserWords(user);

    await this.db.indexedObject.put({
      ...user,
      __words: words,
    });

    await Promise.all(
      [...words].map(async (word) => {
        let wordIndex = await this.db.wordIndex.get(word);

        if (!wordIndex) {
          wordIndex = {
            word,
            occourrences: new Set([user.id]),
          };
        }

        wordIndex.occourrences.add(user.id);
        await this.db.wordIndex.put(wordIndex);
      }),
    );
  }
}
