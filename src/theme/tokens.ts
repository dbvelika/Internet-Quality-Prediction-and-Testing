// DESIGN — medidas reutilizáveis.

export const radius = { sm: 12, md: 16, lg: 24, pill: 999 } as const;

/** Área mínima de toque (RNF09 do documento de requisitos: 48 × 48 dp). */
export const touch = { minSize: 48 } as const;
