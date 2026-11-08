import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AccountProvider, useAccount } from "./AccountContext";
function Workspace() {
  const { session, loading, accountWarning } = useAccount();
  if (loading) return <p role="status">Loading your workspace…</p>;
  return (
    <>
      {accountWarning && (
        <p role="status" className="account-warning">
          {accountWarning}
        </p>
      )}
      <App key={session?.user.id || "guest"} />
    </>
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
