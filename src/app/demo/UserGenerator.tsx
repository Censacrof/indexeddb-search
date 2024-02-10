import { faker } from "@faker-js/faker";
import { useState } from "react";
import Button from "../../common/components/Button";
import Pre from "../../common/components/Pre";
import { User } from "../../features/indexeddbSearch/indexeddbSearch";
import { useSearchSetContext } from "../App";

export default function UserGenerator() {
  const { searchSet } = useSearchSetContext();
  const [userToIngest, setUserToIngest] = useState(randomUser());

  return (
    <div className="flex gap-2">
      <Button
        onClick={async () => {
          await searchSet.ingest(userToIngest);
          setUserToIngest(randomUser());
        }}
      >
        Ingest user
      </Button>
      <Pre>{JSON.stringify(userToIngest, undefined, 2)}</Pre>
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
