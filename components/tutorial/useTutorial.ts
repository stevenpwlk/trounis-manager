"use client";
import { useCallback, useRef, useState } from "react";
import { TUTORIAL_MOMENT_ORDER, type TutorialMomentId } from "./tutorialContent";

const STORAGE_KEY = "trounis-manager-tutorial-seen-v1";

function loadSeen(): Set<TutorialMomentId> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr.filter((x): x is TutorialMomentId => (TUTORIAL_MOMENT_ORDER as string[]).includes(x)));
  } catch {
    return new Set();
  }
}

function persistSeen(seen: Set<TutorialMomentId>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch {
    // stockage indisponible (navigation privée...) — tant pis, le tutoriel se réaffichera
  }
}

/**
 * Suivi "vu/pas vu" à l'échelle du navigateur, pas du monde (GameState reste
 * 100% en ligne côté Supabase, cf. la décision du 2026-07-23 dans GameApp) —
 * un ref (pas un state React) porte le set "vu" pour ne jamais re-render sur
 * un simple changement de progression du tutoriel.
 */
export function useTutorial() {
  const seenRef = useRef<Set<TutorialMomentId> | null>(null);
  if (seenRef.current === null) seenRef.current = loadSeen();
  const [activeId, setActiveId] = useState<TutorialMomentId | null>(null);

  const trigger = useCallback((id: TutorialMomentId) => {
    setActiveId((current) => {
      if (current !== null) return current;
      return seenRef.current!.has(id) ? null : id;
    });
  }, []);

  const dismiss = useCallback(() => {
    setActiveId((current) => {
      if (current) {
        seenRef.current!.add(current);
        persistSeen(seenRef.current!);
      }
      return null;
    });
  }, []);

  const skipAll = useCallback(() => {
    seenRef.current = new Set(TUTORIAL_MOMENT_ORDER);
    persistSeen(seenRef.current);
    setActiveId(null);
  }, []);

  const replay = useCallback(() => {
    seenRef.current = new Set();
    persistSeen(seenRef.current);
    setActiveId(TUTORIAL_MOMENT_ORDER[0]!);
  }, []);

  return { activeId, trigger, dismiss, skipAll, replay };
}
