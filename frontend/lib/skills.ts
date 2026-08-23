export type SkillId = "general" | "executive-assistant";

// Legacy IDs written by old IDB migrations and GDrive backups — normalize on read,
// never on write. Travel is an Executive Assistant tool, not a selectable skill.
const SKILL_ALIASES: Record<string, SkillId> = {
  "career-coach": "executive-assistant",
  "executive-coach": "executive-assistant",
  "travel-planner": "executive-assistant",
  "personal-assistant": "executive-assistant",
};

export function normalizeSkill(skill: string | undefined | null): SkillId {
  if (!skill) return "executive-assistant";
  return (SKILL_ALIASES[skill] ?? (skill === "general" || skill === "executive-assistant" ? skill : "executive-assistant")) as SkillId;
}

export const SKILL_LABELS: Record<string, string> = {
  general: "Tutorial",
  "executive-assistant": "Executive Assistant",
  // Legacy labels are retained for old persisted sessions only.
  "personal-assistant": "Executive Assistant",
  "career-coach": "Executive Assistant",
  "executive-coach": "Executive Assistant",
};
