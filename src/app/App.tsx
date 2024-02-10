import { createContext, useContext } from "react";
import { SearchSet } from "../features/indexeddbSearch/indexeddbSearch";
import Demo from "./demo/Demo";

const searchSet = new SearchSet();

type SearchSetContextValue = { searchSet: SearchSet };
const SearchSetContext = createContext<SearchSetContextValue | undefined>(
  undefined,
);

export function useSearchSetContext() {
  const context = useContext(SearchSetContext);

  if (!context) {
    throw new Error(
      "useSearchSetContext invoked outside SearchSetContext.Provider",
    );
  }

  return context;
}

export default function App() {
  return (
    <SearchSetContext.Provider
      value={{
        searchSet,
      }}
    >
      <Demo />
    </SearchSetContext.Provider>
  );
}
