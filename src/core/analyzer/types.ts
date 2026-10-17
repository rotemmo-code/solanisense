export interface Frame { width: number; height: number; data: Uint8ClampedArray } // RGBA, row-major; structurally compatible with the browser's image data type
export type Lighting = 'ok' | 'dark' | 'tinted';
export interface AnalysisResult { greenRatio: number; mask: Uint8Array; lighting: Lighting } // mask has width*height entries, 1 = green
export interface Analyzer { analyze(frame: Frame): AnalysisResult }
export type Verdict = 'none' | 'local' | 'widespread';
