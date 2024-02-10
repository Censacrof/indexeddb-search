import { faker } from "@faker-js/faker";
import { useSearchSetContext } from "../App";

export default function Demo() {
  const { searchSet } = useSearchSetContext();

  return (
    <div className="p-4">
      <button
        className="h-10 min-w-20 rounded bg-gray-300 px-2 text-gray-700 hover:bg-gray-200 hover:text-gray-600 active:bg-gray-100 active:text-gray-500"
        onClick={async () => {
          void searchSet.ingest({
            id: window.crypto.randomUUID(),
            address: faker.location.streetAddress(),
            name: faker.person.fullName(),
            phoneNumber: "+66 666 666666",
          });
        }}
      >
        Ingest user
      </button>
    </div>
  );
}
