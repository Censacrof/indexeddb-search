import UserGenerator from "./UserGenerator";
import UserSearch from "./UserSearch";

export default function Demo() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <UserGenerator />
      <UserSearch />
    </div>
  );
}
