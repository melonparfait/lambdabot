export enum OffenseScore {
  nothing,
  weak,
  medium,
  strong,
  bullseye
}

export interface ScoringResults {
  offenseResult: OffenseScore,
  defenseResult: boolean,
  team1PointChange: number,
  team2PointChange: number
}