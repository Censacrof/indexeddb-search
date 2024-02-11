import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { ChangeEventHandler, useState } from "react";
import { twMerge } from "tailwind-merge";
import Input from "../../common/components/Input";
import { useSearchSetContext } from "../App";

const searchModeValues = ["startsWith", "contains"] as const;
type SearchMode = (typeof searchModeValues)[number];
function isValidSearchMode(str: string): str is SearchMode {
  return searchModeValues.includes(str as never);
}

export default function UserSearch() {
  const { searchSet } = useSearchSetContext();
  const [searchMode, setSearchMode] = useState<SearchMode>("contains");
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchModeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!isValidSearchMode(e.target.value)) {
      return;
    }

    setSearchMode(e.target.value);
  };

  const debouncedSearchTerm = useDebounce(`${searchTerm}`, 250);

  const {
    data: result,
    isLoading,
    isPlaceholderData,
  } = useQuery({
    queryKey: [debouncedSearchTerm, searchMode],
    queryFn: async () => {
      switch (searchMode) {
        case "contains": {
          return await searchSet.searchContains(debouncedSearchTerm);
        }

        case "startsWith": {
          return await searchSet.searchStartsWith(debouncedSearchTerm);
        }
      }
    },
    placeholderData: keepPreviousData,
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          className="h-8 rounded bg-gray-50 px-2 text-gray-900"
          type="text"
          placeholder="e.g Mario Rossi"
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
          }}
        />

        <label htmlFor="startsWithMode">Starts With</label>
        <Input
          name="searchMode"
          id="startsWithMode"
          type="radio"
          value="startsWith"
          onChange={handleSearchModeChange}
          checked={searchMode === "startsWith"}
        />

        <label htmlFor="containsMode">Contains</label>
        <Input
          name="searchMode"
          id="startsWithMode"
          type="radio"
          value="contains"
          onChange={handleSearchModeChange}
          checked={searchMode === "contains"}
        />
      </div>

      <table
        className={twMerge(
          (isLoading || isPlaceholderData) && "animate-pulse opacity-30",
        )}
      >
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Address</th>
            <th>Phone Number</th>
          </tr>
        </thead>
        <tbody>
          {result?.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.address}</td>
              <td>{user.phoneNumber}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
