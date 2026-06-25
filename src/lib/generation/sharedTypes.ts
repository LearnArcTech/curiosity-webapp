export type CalloutVariant = "info" | "tip" | "warning";

export interface HeadingBlockSpec {
  type: "heading";
  text: string;
  level?: 1 | 2 | 3;
}

export interface TextBlockSpec {
  type: "text";
  text: string;
}

export interface CalloutBlockSpec {
  type: "callout";
  variant?: CalloutVariant;
  text: string;
}

export interface DividerBlockSpec {
  type: "divider";
}

export interface StepSequenceStep {
  title: string;
  content: string;
}

export interface StepSequenceBlockSpec {
  type: "step-sequence";
  title?: string;
  steps: StepSequenceStep[];
}

export interface MatrixSeed {
  rows: number;
  cols: number;
  values?: number[][];
}

export interface MatrixMultiplicationBlockSpec {
  type: "matrix-multiplication";
  title?: string;
  maxSize?: number;
  editable?: boolean;
  matrixA: MatrixSeed;
  matrixB: MatrixSeed;
}

export type ExampleBlock =
  | HeadingBlockSpec
  | TextBlockSpec
  | CalloutBlockSpec
  | DividerBlockSpec
  | StepSequenceBlockSpec
  | MatrixMultiplicationBlockSpec;

export const KNOWN_BLOCK_TYPES = [
  "heading",
  "text",
  "callout",
  "divider",
  "step-sequence",
  "matrix-multiplication",
] as const;

export interface ExampleSpec {
  kind: "interactive-example";
  title: string;
  description?: string;
  blocks: ExampleBlock[];
}
