import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { ChangeEventHandler, useState } from "react";
import { twMerge } from "tailwind-merge";
import Input from "../../common/components/Input";
import { User } from "../../features/indexeddbSearch/indexeddbSearch";
import { useSearchSetContext } from "../App";

const searchModeValues = ["startsWith", "contains", "containsBrute"] as const;
type SearchMode = (typeof searchModeValues)[number];
function isValidSearchMode(str: string): str is SearchMode {
  return searchModeValues.includes(str as never);
}

export default function UserSearch() {
  const [searchMode, setSearchMode] = useState<SearchMode>("contains");
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchModeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!isValidSearchMode(e.target.value)) {
      return;
    }

    setSearchMode(e.target.value);
  };

  const debouncedSearchTerm = useDebounce(`${searchTerm}`, 250);

  const searchQuery = useSearchUsers({ term: debouncedSearchTerm, searchMode });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-4">
        <Input
          className="h-8 rounded bg-gray-50 px-2 text-gray-900"
          type="text"
          placeholder="e.g Mario Rossi"
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
          }}
        />

        <fieldset className="flex gap-6">
          <legend className="text-gray-400">Search mode</legend>

          <div className="flex items-center gap-2">
            <Input
              name="searchMode"
              id="startsWithMode"
              type="radio"
              value={"startsWith" satisfies SearchMode}
              onChange={handleSearchModeChange}
              checked={searchMode === "startsWith"}
            />
            <label htmlFor="startsWithMode">Starts With</label>
          </div>

          <div className="flex items-center gap-2">
            <Input
              name="searchMode"
              id="containsMode"
              type="radio"
              value={"contains" satisfies SearchMode}
              onChange={handleSearchModeChange}
              checked={searchMode === "contains"}
            />
            <label htmlFor="containsMode">Contains</label>
          </div>

          <div className="flex items-center gap-2">
            <Input
              name="searchMode"
              id="containsBruteMode"
              type="radio"
              value={"containsBrute" satisfies SearchMode}
              onChange={handleSearchModeChange}
              checked={searchMode === "containsBrute"}
            />
            <label htmlFor="containsBruteMode">Contains (brute)</label>
          </div>
        </fieldset>
      </div>

      <div className="flex flex-col gap-2">
        <span>
          Returned {searchQuery.data?.result.length} records in{" "}
          {searchQuery.data?.tookMs}ms
        </span>
        <table
          className={twMerge(
            (searchQuery.isLoading || searchQuery.isPlaceholderData) &&
              "animate-pulse opacity-30",
          )}
        >
          <thead>
            <tr>
              <th>Id</th>
              <th>Name</th>
              <th>Address</th>
              <th>Phone Number</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {searchQuery.data?.result.map((user) => (
              <tr key={user.id} className="p-2 text-sm even:bg-gray-700">
                <td className="pl-2-2">{user.id}</td>
                <td>{user.name}</td>
                <td>{user.address}</td>
                <td>{user.phoneNumber}</td>
                <td className="pr-2 text-xs">{user.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function useSearchUsers({
  term: debouncedSearchTerm,
  searchMode,
}: {
  term: string;
  searchMode: SearchMode;
}) {
  const { searchSet } = useSearchSetContext();

  return useQuery({
    queryKey: [debouncedSearchTerm, searchMode],
    queryFn: async () => {
      let result: User[];
      const startTime = Date.now();
      switch (searchMode) {
        case "contains": {
          result = await searchSet.searchContains(debouncedSearchTerm);
          break;
        }

        case "startsWith": {
          result = await searchSet.searchStartsWith(debouncedSearchTerm);
          break;
        }

        case "containsBrute": {
          result = await searchSet.searchContainsBrute(debouncedSearchTerm);
          break;
        }
      }

      return { result, tookMs: Date.now() - startTime };
    },
    placeholderData: keepPreviousData,
  });
}
