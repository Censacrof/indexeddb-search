import { faker } from "@faker-js/faker";
import { useState } from "react";
import Button from "../../common/components/Button";
import Pre from "../../common/components/Pre";
import { User } from "../../features/indexeddbSearch/indexeddbSearch";
import { useSearchSetContext } from "../App";

export default function UserGenerator() {
  const { searchSet } = useSearchSetContext();
  const [userToIngest, setUserToIngest] = useState(randomUser());
  const [isIngestDisabled, setIsIngestDisabled] = useState(false);

  return (
    <div className="flex gap-2">
      <div className="flex flex-col gap-2">
        <Button
          onClick={async () => {
            setIsIngestDisabled(true);

            await searchSet.ingest(userToIngest);
            setUserToIngest(randomUser());

            setIsIngestDisabled(false);
          }}
          disabled={isIngestDisabled}
        >
          Ingest user
        </Button>

        <Button
          onClick={async () => {
            setIsIngestDisabled(true);

            let uToIng = userToIngest;
            const allUsersToIngest = Array.from(new Array(10000).keys()).map(
              () => {
                const ret = uToIng;
                uToIng = randomUser();
                return ret;
              },
            );

            await searchSet.ingest(...allUsersToIngest);

            setUserToIngest(uToIng);

            setIsIngestDisabled(false);
          }}
          disabled={isIngestDisabled}
        >
          Ingest user (10000x)
        </Button>
      </div>
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
