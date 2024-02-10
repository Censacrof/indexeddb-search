import { useDebounce } from "@uidotdev/usehooks";
import { ChangeEventHandler, useEffect, useState } from "react";
import Input from "../../common/components/Input";
import { User } from "../../features/indexeddbSearch/indexeddbSearch";
import { useSearchSetContext } from "../App";

const searchModeValues = ["startsWith", "contains"] as const;
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
  const result = useSearch(debouncedSearchTerm, searchMode);

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

      <table>
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Address</th>
            <th>Phone Number</th>
          </tr>
        </thead>
        <tbody>
          {result.map((user) => (
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

function useSearch(term: string, mode: SearchMode) {
  const { searchSet } = useSearchSetContext();
  const [result, setResult] = useState<User[]>([]);

  useEffect(() => {
    switch (mode) {
      case "contains": {
        searchSet.searchContains(term).then((res) => setResult(res));
        break;
      }

      case "startsWith": {
        searchSet.searchContains(term).then((res) => setResult(res));
        break;
      }
    }
  }, [mode, searchSet, term]);

  return result;
}
