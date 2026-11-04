// ACESSIBILIDADE — guarda o texto da tela atual para o VLibras traduzir (usado no celular).
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type SetLines = (lines: string[]) => void;

// Dois contextos separados: as telas só precisam do "setter" (que nunca muda) e não devem
// renderizar de novo quando o texto muda.
const LinesContext = createContext<string[]>([]);
const SetLinesContext = createContext<SetLines>(() => {});

export function LibrasProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<string[]>([]);

  return (
    <SetLinesContext.Provider value={setLines}>
      <LinesContext.Provider value={lines}>{children}</LinesContext.Provider>
    </SetLinesContext.Provider>
  );
}

/** Texto da tela atual, para quem mostra o VLibras. */
export function useLibrasLines(): string[] {
  return useContext(LinesContext);
}

/**
 * Cada tela chama este hook com o que está escrito nela, uma frase por item.
 * Ao sair da tela, o texto é apagado. Use só valores de texto, sem objetos novos a cada render.
 */
export function useLibrasText(lines: string[]): void {
  const setLines = useContext(SetLinesContext);
  const key = JSON.stringify(lines);

  useEffect(() => {
    setLines(JSON.parse(key) as string[]);
    return () => setLines([]);
  }, [key, setLines]);
}
