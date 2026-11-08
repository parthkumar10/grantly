import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
const SESSION_INIT_TIMEOUT_MS = 8000;
const Context = createContext<{
  session: Session | null;
  loading: boolean;
  accountWarning: string | null;
}>({
  session: null,
  loading: true,
  accountWarning: null,
});
export const useAccount = () => useContext(Context);
export function AccountProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountWarning, setAccountWarning] = useState<string | null>(null);
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    let initialized = false;
    const finishInitialization = () => {
      initialized = true;
      clearTimeout(timeout);
      setLoading(false);
    };
    const timeout = setTimeout(() => {
      if (!initialized) {
        console.error("Supabase session initialization timed out.");
        setAccountWarning(
          "Account service did not respond. Continuing in guest mode; cloud sign-in is unavailable.",
        );
        finishInitialization();
      }
    }, SESSION_INIT_TIMEOUT_MS);
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("Could not initialize the account session.", error);
          setAccountWarning(
            "Account session could not be loaded. Continuing in guest mode; cloud sign-in may be unavailable.",
          );
          setSession(null);
        } else {
          setSession(data.session);
          setAccountWarning(null);
        }
        finishInitialization();
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error("Could not initialize the account session.", error);
        setAccountWarning(
          "Account session could not be loaded. Continuing in guest mode; cloud sign-in may be unavailable.",
        );
        finishInitialization();
      });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!active) return;
      setSession(s);
      setAccountWarning(null);
      finishInitialization();
    });
    return () => {
      active = false;
      clearTimeout(timeout);
      data.subscription.unsubscribe();
    };
  }, []);
  return (
    <Context.Provider value={{ session, loading, accountWarning }}>
      {children}
    </Context.Provider>
  );
}
