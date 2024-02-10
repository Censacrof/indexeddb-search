import { faker } from "@faker-js/faker";
import { useState } from "react";
import { User } from "../../features/indexeddbSearch/indexeddbSearch";
import { useSearchSetContext } from "../App";

export default function UserGenerator() {
  const { searchSet } = useSearchSetContext();
  const [userToIngest, setUserToIngest] = useState(randomUser());

  return (
    <div className="flex gap-2">
      <button
        className="h-10 min-w-20 rounded bg-gray-300 px-2 text-gray-700 hover:bg-gray-200 hover:text-gray-600 active:bg-gray-100 active:text-gray-500"
        onClick={async () => {
          await searchSet.ingest(userToIngest);
          setUserToIngest(randomUser());
        }}
      >
        Ingest user
      </button>
      <pre className="rounded border border-gray-400 bg-gray-800 p-2">
        {JSON.stringify(userToIngest, undefined, 4)}
      </pre>
    </div>
  );
}

function randomUser(): User {
  return {
    id: faker.string.uuid(),
    address: faker.location.streetAddress(),
    name: faker.person.fullName(),
    phoneNumber: faker.phone.number(),
  };
}
