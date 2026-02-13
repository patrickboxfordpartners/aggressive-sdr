import { AGENT_ORDER, AGENT_LABELS, AGENT_COLORS, type AgentName } from "./sdr";

describe("sdr models", () => {
  test("AGENT_ORDER contains all 5 agents in correct sequence", () => {
    expect(AGENT_ORDER).toEqual(["scout", "qualifier", "challenger", "closer", "coordinator"]);
  });

  test("AGENT_LABELS has a label for every agent", () => {
    for (const agent of AGENT_ORDER) {
      expect(AGENT_LABELS[agent]).toBeTruthy();
      expect(typeof AGENT_LABELS[agent]).toBe("string");
    }
  });

  test("AGENT_COLORS has a color for every agent", () => {
    for (const agent of AGENT_ORDER) {
      expect(AGENT_COLORS[agent]).toBeTruthy();
      expect(AGENT_COLORS[agent]).toMatch(/^bg-/);
    }
  });

  test("AGENT_ORDER has no duplicates", () => {
    const unique = new Set(AGENT_ORDER);
    expect(unique.size).toBe(AGENT_ORDER.length);
  });
});
