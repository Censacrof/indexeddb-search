import Dexie from "dexie";

class FullTextSearchDatabase extends Dexie {
  indexedObject!: Dexie.Table<IndexedObject<User>, string>;

  constructor() {
    super("FullTextSearchDatabase");

    this.version(1).stores({
      indexedObject: "&id, *__words, *__syllables",
    });
  }
}

export type WordIndex = {
  word: string;
  occourrences: string[];
};

export type IndexedObject<T> = T & {
  __words: string[];
  __syllables: string[];
};

export type User = {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
};

function getWords(str: string): string[] {
  return str.toLowerCase().split(/\s+/gm);
}

function extractUserWords(user: User): Set<string> {
  return new Set([
    ...getWords(user.name),
    ...getWords(user.address),
    ...getWords(user.phoneNumber),
  ]);
}

function getSyllables(str: string): string[] {
  str = str.toLowerCase();

  const syllables = new Array<string>();
  for (let i = 1; i < str.length; i++) {
    syllables.push(`${str[i - 1]}${str[i]}`);
  }

  return syllables;
}

function extractUserSyllables(user: User): Set<string> {
  return new Set([
    ...getSyllables(user.name),
    ...getSyllables(user.address),
    ...getSyllables(user.phoneNumber),
  ]);
}

export class SearchSet {
  constructor(private db = new FullTextSearchDatabase()) {}

  async ingest(...users: User[]) {
    const indexedObjectBulk = new Array<IndexedObject<User>>();

    users.forEach((user) => {
      const words = extractUserWords(user);
      const syllables = extractUserSyllables(user);

      indexedObjectBulk.push({
        ...user,
        __words: [...words],
        __syllables: [...syllables],
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
