import { ScenarioTemplate, CurrentState } from "@/types/context"

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
export function parseScenarioTemplate(json): ScenarioTemplate {
  try {
    if (typeof json === "string") {
      json = JSON.parse(json)
    }
    return {
      name: json?.name || "",
      description: json?.description || "",
      attributes: json?.attributes || {},
      baseSkills: json?.baseSkills || {},
      playerCustomizations: json?.playerCustomizations || {},
      startingPoint: json?.startingPoint || "",
    }
  } catch (error) {
    console.error("解析场景模板失败:", error)
    return {
      name: "",
      description: "",
      attributes: {},
      baseSkills: {},
      playerCustomizations: {},
      startingPoint: "",
    }
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
export function parseCurrentState(json): CurrentState {
  try {
    if (typeof json === "string") {
      json = JSON.parse(json)
    }

    return {
      player_character_stats: json?.player_character_stats || {},
      current_location: json?.current_location || "",
      inventory: json?.inventory || {},
      npcs_state: json?.npcs_state || {},
      game_time: json?.game_time || "",
      quest_log: json?.quest_log || [],
      meaningful_decisions: json?.meaningful_decisions || [],
    }
  } catch (error) {
    console.error("解析当前状态失败:", error)
    return {
      player_character_stats: {},
      current_location: "",
      inventory: {},
      npcs_state: {},
      game_time: "",
      quest_log: [],
      meaningful_decisions: [],
    }
  }
}
