import Dexie from "dexie";

class FullTextSearchDatabase extends Dexie {
  wordIndex!: Dexie.Table<WordIndex, string>;
  indexedObject!: Dexie.Table<IndexedObject<User>, string>;

  constructor() {
    super("FullTextSearchDatabase");

    this.version(1).stores({
      wordIndex: "&word",
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

  async ingest(user: User) {
    const words = [...extractUserWords(user)];

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
            occourrences: [user.id],
          };
        }

        wordIndex.occourrences = [
          ...new Set([...wordIndex.occourrences, user.id]),
        ];
        await this.db.wordIndex.put(wordIndex);
      }),
    );
  }

  async searchStartsWith(term: string): Promise<User[]> {
    const lowerCaseTerm = term.toLowerCase();

    const wordIndices = await this.db.wordIndex
      .where("word")
      .startsWith(lowerCaseTerm)
      .distinct()
      .toArray();

    const allOccourrences = new Set<string>();
    for (const wordIndex of wordIndices) {
      wordIndex.occourrences.forEach((occourrence) => {
        allOccourrences.add(occourrence);
      });
    }

    const result = (
      await Promise.all(
        [...allOccourrences].map((id) => this.db.indexedObject.get(id)),
      )
    ).filter((u): u is IndexedObject<User> => {
      return !!u;
    });

    return result;
  }
}
