declare module 'fontkit' {
  export interface Font {
    layout(text: string): unknown;
    getVariation(settings: Record<string, number>): Font;
  }

  export function create(buffer: Uint8Array): Font;
}
