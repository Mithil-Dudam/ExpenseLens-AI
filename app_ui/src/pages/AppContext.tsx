import { createContext, useContext, useState } from "react";

interface AppContextType  {
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  userId: number | null;
  setUserId: (id: number | null) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userId, setUserId] = useState<number | null>(null);

  return (
    <AppContext.Provider value={{ isLoggedIn, setIsLoggedIn, userId, setUserId }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = ():AppContextType => {
  const context = useContext(AppContext);
  if (!context){
    throw new Error("useAppContext must be used within AppProvider")
  };
  return context;
};