import { createContext, useContext, useState } from "react";

const UserContext = createContext<any>(null);

export function UserProvider({ children }: { children: any }) {
  const [user, setUser] = useState({
    name: "",
    age: null,
    occupation: "",
    location: "",
    incomeRange: "",
    category: "",
    language: "ta",
  });

  const [recommendedSchemes, setRecommendedScheme] = useState([]);

  return (
    <UserContext.Provider value={{ user, setUser, recommendedSchemes, setRecommendedScheme }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
