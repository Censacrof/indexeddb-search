import Dexie from "dexie";

class FullTextSearchDatabase extends Dexie {
  indexedObject!: Dexie.Table<IndexedObject<User>, string>;
  wordIndex!: Dexie.Table<WordIndex, string>;

  constructor() {
    super("FullTextSearchDatabase");

    this.version(1).stores({
      indexedObject: "&id",
      wordIndex: "&word, *__parts",
    });
  }
}

export type IndexedObject<T> = T & {
  words: Set<string>;
};

export type WordIndex = {
  word: string;
  objects: Set<string>;
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

      const newIndexedObject = {
        ...user,
        words,
      };
      indexedObjectBulk.push(newIndexedObject);

      for (const word of words) {
        if (!wordIndexToBulkMap.has(word)) {
          wordIndexToBulkMap.set(word, {
            word,
            objects: new Set([]),
            __parts: getWordParts(word),
          });
        }

        wordIndexToBulkMap.get(word)?.objects.add(newIndexedObject.id);
      }
    });

    await this.db.transaction(
      "rw",
      this.db.wordIndex,
      this.db.indexedObject,
      async () => {
        (
          await this.db.wordIndex
            .where("word")
            .anyOf(...wordIndexToBulkMap.keys())
            .toArray()
        ).forEach((wi) => {
          const wiToBulk = wordIndexToBulkMap.get(wi.word);
          if (!wiToBulk) {
            return;
          }

          wiToBulk.objects = new Set([...wi.objects, ...wiToBulk.objects]);
        });

        await Promise.all([
          this.db.indexedObject.bulkPut(indexedObjectBulk),
          this.db.wordIndex.bulkPut([...wordIndexToBulkMap.values()]),
        ]);
      },
    );
  }

  async searchStartsWith(term: string): Promise<User[]> {
    term = term.trim();
    if (term.length < 3) {
      return [];
    }

    const lowerCaseTerm = term.toLowerCase();
    const termWords = getWords(lowerCaseTerm);

    return await this.db.indexedObject
      .where("words")
      .startsWithAnyOf(termWords)
      .distinct()
      .filter((u) => doesUserHaveTerm(u, term))
      .toArray();
  }

  async searchContains(term: string) {
    term = term.trim();
    if (term.length < 3) {
      return [];
    }

    const termWords = getWords(term);
    if (termWords.length === 0) {
      return [];
    }

    const potentialMatches =
      await this.getContainsSearchPotentialMatches(termWords);

    return potentialMatches.filter((u) => doesUserHaveTerm(u, term));
  }

  async getContainsSearchPotentialMatches(
    termWords: string[],
  ): Promise<User[]> {
    let potentialMatchObjectIds: Set<string>;
    if (termWords.length === 1) {
      // single word query
      const wordsContainingTerm = await this.getWordsContaining(termWords[0]);

      potentialMatchObjectIds = new Set(
        wordsContainingTerm.flatMap((wi) => [...wi.objects]),
      );
    } else {
      // multiple word query
      const objectsThatHaveWordsEndingWithTerm = setUnion(
        ...(await this.getWordsEndingWith(termWords[0])).map(
          (wi) => wi.objects,
        ),
      );

      const objectsThatHaveWordsStartingWithTerm = setUnion(
        ...(
          await this.getWordsStartingWith(termWords[termWords.length - 1])
        ).map((wi) => wi.objects),
      );

      potentialMatchObjectIds = setIntersection(
        objectsThatHaveWordsEndingWithTerm,
        objectsThatHaveWordsStartingWithTerm,
      );

      for (let i = 1; i < termWords.length - 1; i++) {
        const objectsThatHaveExactWord = (await this.getWordExact(termWords[i]))
          ?.objects;

        if (!objectsThatHaveExactWord) {
          continue;
        }

        potentialMatchObjectIds = setIntersection(
          potentialMatchObjectIds,
          objectsThatHaveExactWord,
        );
      }
    }

    return (
      await this.db.indexedObject.bulkGet([...potentialMatchObjectIds])
    ).filter(
      (obj: IndexedObject<User> | undefined): obj is IndexedObject<User> => {
        return !!obj;
      },
    );
  }

  async getWordsStartingWith(startsWith: string) {
    return await this.db.wordIndex
      .where("word")
      .startsWith(startsWith)
      .toArray();
  }

  async getWordsEndingWith(endsWith: string) {
    return await this.db.wordIndex
      .where("__parts")
      .equals(endsWith)
      .distinct()
      .toArray();
  }

  async getWordsContaining(contains: string): Promise<WordIndex[]> {
    return await this.db.wordIndex
      .where("__parts")
      .startsWith(contains)
      .distinct()
      .toArray();
  }

  async getWordExact(exactWord: string) {
    return await this.db.wordIndex.get(exactWord);
  }

  async searchContainsBrute(term: string): Promise<User[]> {
    term = term.trim();
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

function setUnion<T>(...sets: (Set<T> | Array<T>)[]): Set<T> {
  return new Set(sets.flatMap((s) => [...s]));
}

function setIntersection<T>(set0: Set<T>, ...otherSets: Set<T>[]): Set<T> {
  let ret = set0;

  for (const s of otherSets) {
    ret = new Set([...s].filter((element) => ret.has(element)));
  }

  return ret;
}
