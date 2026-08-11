/**
 * The program catalog lives in a single source of truth: src/data/programs.tsx.
 * This file only re-exports it so existing imports keep working and the two
 * previously-drifted copies can never diverge again.
 */
export { programs, PRICING, GAME_INFO } from "@/data/programs";
export type { ProgramEntry } from "@/data/programs";
