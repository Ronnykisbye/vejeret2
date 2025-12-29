/* =========================================================
   Afsnit 01 – PWA Install Button
   ========================================================= */
import React, { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Hvis appen allerede er installeret: skjul knappen
    const mq = window.matchMedia?.("(display-mode: standalone)");
    if (mq?.matches) setVisible(false);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onInstall}
      className="rounded-xl px-4 py-2 text-sm font-semibold bg-white/10 hover:bg-white/15
                 border border-white/10 text-white"
    >
      Installer app
    </button>
  );
}
