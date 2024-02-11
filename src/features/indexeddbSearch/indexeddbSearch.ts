import Dexie from "dexie";

class FullTextSearchDatabase extends Dexie {
  indexedObject!: Dexie.Table<IndexedObject<User>, string>;

  constructor() {
    super("FullTextSearchDatabase");

    this.version(1).stores({
      indexedObject: "&id, *__words, *__trigrams",
    });
  }
}

export type IndexedObject<T> = T & {
  __words: string[];
  __trigrams: string[];
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

function getTrigrams(str: string): string[] {
  str = str.toLowerCase();

  const trigrams = new Array<string>();
  for (let i = 2; i < str.length; i++) {
    trigrams.push(`${str[i - 2]}${str[i - 1]}${str[i]}`);
  }

  return trigrams;
}

function extractUserTrigrams(user: User): Set<string> {
  return new Set([
    ...getTrigrams(user.name),
    ...getTrigrams(user.address),
    ...getTrigrams(user.phoneNumber),
  ]);
}

function doesUserHaveTerm(user: User, term: string) {
  term = term.toLowerCase();

  return (
    user.name.toLowerCase().includes(term) ||
    user.address.toLowerCase().includes(term) ||
    user.phoneNumber.toLowerCase().includes(term)
  );
}

export class SearchSet {
  constructor(private db = new FullTextSearchDatabase()) {}

  async ingest(...users: User[]) {
    const indexedObjectBulk = new Array<IndexedObject<User>>();

    users.forEach((user) => {
      const words = extractUserWords(user);
      const trigrams = extractUserTrigrams(user);

      indexedObjectBulk.push({
        ...user,
        __words: [...words],
        __trigrams: [...trigrams],
      });
    });

    await this.db.indexedObject.bulkPut(indexedObjectBulk);
  }

  async searchStartsWith(term: string): Promise<User[]> {
    if (term.length < 3) {
      return [];
    }

    const lowerCaseTerm = term.toLowerCase();

    return await this.db.indexedObject
      .where("__words")
      .startsWith(lowerCaseTerm)
      .distinct()
      .toArray();
  }

  async searchContains(term: string): Promise<User[]> {
    if (term.length < 3) {
      return [];
    }

    const termTrigrams = getTrigrams(term);

    return (
      await this.db.indexedObject
        .where("__trigrams")
        .anyOf(termTrigrams)
        .distinct()
        .toArray()
    ).filter((u) => {
      const trigrams = new Set(u.__trigrams);
      const hasAllTrigrams = termTrigrams.every((tt) => trigrams.has(tt));
      if (!hasAllTrigrams) {
        return false;
      }

      return doesUserHaveTerm(u, term);
    });
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
