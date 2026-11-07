import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AccountProvider, useAccount } from "./AccountContext";
function Workspace() {
  const { session, loading } = useAccount();
  return loading ? (
    <p role="status">Loading your workspace…</p>
  ) : (
    <App key={session?.user.id || "guest"} />
  );
}
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AccountProvider>
      <Workspace />
    </AccountProvider>
  </React.StrictMode>,
);
