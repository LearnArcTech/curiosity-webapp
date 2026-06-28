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

export interface MatrixArithmeticBlockSpec {
  type: "matrix-arithmetic";
  title?: string;
  operation?: "add" | "subtract"; // default "add"
  maxSize?: number;
  editable?: boolean;
  matrixA: MatrixSeed;
  matrixB: MatrixSeed;
}

export interface DeterminantBlockSpec {
  type: "determinant";
  title?: string;
  editable?: boolean;
  matrix: MatrixSeed;
}

export interface GaussianEliminationBlockSpec {
  type: "gaussian-elimination";
  title?: string;
  augmented: {
    rows: number;
    cols: number; // must be rows + 1
    values: number[][];
  };
}

export interface MatrixInverseBlockSpec {
  type: "matrix-inverse";
  title?: string;
  editable?: boolean;
  matrix: MatrixSeed;
}

export interface VectorOperationsBlockSpec {
  type: "vector-operations";
  title?: string;
  dimension?: 2 | 3;
  editable?: boolean;
  vectorA: number[];
  vectorB: number[];
}

export interface LinearTransformBlockSpec {
  type: "linear-transform";
  title?: string;
  editable?: boolean;
  matrix: MatrixSeed;
}

export interface LUDecompositionBlockSpec {
  type: "lu-decomposition";
  title?: string;
  editable?: boolean;
  matrix: MatrixSeed;
}

export interface EigenvalueBlockSpec {
  type: "eigenvalue";
  title?: string;
  editable?: boolean;
  matrix: MatrixSeed;
}

export interface CustomBlockSpec {
  type: "custom";
  title?: string;
  html: string;
  height?: number;
}

export type ExampleBlock =
  | HeadingBlockSpec
  | TextBlockSpec
  | CalloutBlockSpec
  | DividerBlockSpec
  | StepSequenceBlockSpec
  | MatrixMultiplicationBlockSpec
  | MatrixArithmeticBlockSpec
  | DeterminantBlockSpec
  | GaussianEliminationBlockSpec
  | MatrixInverseBlockSpec
  | VectorOperationsBlockSpec
  | LinearTransformBlockSpec
  | LUDecompositionBlockSpec
  | EigenvalueBlockSpec
  | CustomBlockSpec;

export const KNOWN_BLOCK_TYPES = [
  "heading",
  "text",
  "callout",
  "divider",
  "step-sequence",
  "matrix-multiplication",
  "matrix-arithmetic",
  "determinant",
  "gaussian-elimination",
  "matrix-inverse",
  "vector-operations",
  "linear-transform",
  "lu-decomposition",
  "eigenvalue",
  "custom",
] as const;

export interface ExampleSpec {
  kind: "interactive-example";
  title: string;
  description?: string;
  blocks: ExampleBlock[];
}
