export interface ScenarioTemplate {
  name?: string;
  description?: string;
  attributes?: { [key: string]: number };
  baseSkills?: { [key: string]: string };
  playerCustomizations?: unknown;
  startingPoint?: string;
}

export interface CurrentState {
  player_character_stats?: { [key: string]: number };
  current_location?: string;
  inventory?: unknown;
  npcs_state?: unknown;
  game_time?: string;
  quest_log?: unknown;
  meaningful_decisions?: unknown;
}

export interface GameContext {
  scenarioTemplate: ScenarioTemplate
  currentState: CurrentState
  conversationHistory: Array<{
    role: "user" | "assistant" | "system"
    content: string
    turn_number: number
  }>
}

export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  turn_number: number
}

export interface GameSession {
  id: string
  scenario_id: string
  current_state: CurrentState
  status: string
  scenarios: {
    name: string
    description: string
    template_json: ScenarioTemplate,
  }
  created_at: string
  updated_at: string
}

