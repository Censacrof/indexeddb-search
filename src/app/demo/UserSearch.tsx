import { ChangeEventHandler, useState } from "react";
import Button from "../../common/components/Button";
import Input from "../../common/components/Input";
import { useSearchSetContext } from "../App";

export default function UserSearch() {
  const [searchTerm, setSearchTerm] = useState("");

  const { searchSet } = useSearchSetContext();

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className="flex gap-2">
      <Input
        className="h-8 rounded bg-gray-50 px-2 text-gray-900"
        type="text"
        placeholder="e.g Mario Rossi"
        value={searchTerm}
        onChange={handleChange}
      />
      <Button
        onClick={async () => {
          console.log(await searchSet.searchStartsWith(searchTerm));
        }}
      >
        Search "starts with"
      </Button>
      <Button
        onClick={async () => {
          console.log(await searchSet.searchContains(searchTerm));
        }}
      >
        Search "contains"
      </Button>
    </div>
  );
}
