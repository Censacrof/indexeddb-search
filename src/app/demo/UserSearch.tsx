import { ChangeEventHandler, useState } from "react";
import Input from "../../common/components/Input";

export default function UserSearch() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div>
      <Input
        className="h-8 rounded bg-gray-50 px-2 text-gray-900"
        type="text"
        placeholder="e.g Mario Rossi"
        value={searchTerm}
        onChange={handleChange}
      />
    </div>
  );
}
