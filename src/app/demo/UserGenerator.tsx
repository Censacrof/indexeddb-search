import { faker } from "@faker-js/faker";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import Button from "../../common/components/Button";
import Pre from "../../common/components/Pre";
import { User } from "../../features/indexeddbSearch/indexeddbSearch";
import { useSearchSetContext } from "../App";

export default function UserGenerator() {
  const {
    mutateAsync: ingestUsers,
    data: ingestUsersData,
    isPending: isIngestPending,
    isSuccess: isIngestSuccess,
  } = useIngestUsers();

  const [userToIngest, setUserToIngest] = useState(randomUser());

  return (
    <div className="flex gap-2">
      <div className="flex shrink-0 flex-col gap-2">
        <Button
          onClick={async () => {
            await ingestUsers([userToIngest]);
            setUserToIngest(randomUser());
          }}
          disabled={isIngestPending}
        >
          Ingest user
        </Button>

        <Button
          onClick={async () => {
            let uToIng = userToIngest;
            const allUsersToIngest = Array.from(new Array(10000).keys()).map(
              () => {
                const ret = uToIng;
                uToIng = randomUser();
                return ret;
              },
            );

            await ingestUsers(allUsersToIngest);

            setUserToIngest(uToIng);
          }}
          disabled={isIngestPending}
        >
          Ingest user (10000x)
        </Button>

        {isIngestPending && <span>Ingesting...</span>}
        {isIngestSuccess && <span>Done in {ingestUsersData.tookMs}ms</span>}
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
    note: faker.lorem.paragraphs(),
  };
}

function useIngestUsers() {
  const { searchSet } = useSearchSetContext();

  return useMutation({
    mutationFn: async (usersToIngest: User[]) => {
      const startTime = Date.now();
      await searchSet.ingest(...usersToIngest);
      return { tookMs: Date.now() - startTime };
    },
  });
}
