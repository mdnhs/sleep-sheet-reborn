export const PixelMapping: Record<string, string> = {
  page_a: "111111111111111",
  page_b: "222222222222222",
  page_c: "333333333333333",
}

export type PageName = keyof typeof PixelMapping

let runtimeMappings: Record<string, string> = {}

export function setRuntimeMappings(mappings: Record<string, string>): void {
  runtimeMappings = { ...mappings }
}

export function getAllMappings(): Record<string, string> {
  return { ...PixelMapping, ...runtimeMappings }
}

export function getPixelId(pageName: string): string | undefined {
  return runtimeMappings[pageName] ?? PixelMapping[pageName]
}

export function isValidPixelId(value: string): boolean {
  return /^\d{15,16}$/.test(value)
}

export function resolvePixelId(
  pixelParam?: string | null,
  pageParam?: string | null,
): string | undefined {
  if (pixelParam && isValidPixelId(pixelParam)) {
    return pixelParam
  }
  if (pageParam) {
    return getPixelId(pageParam)
  }
  return undefined
}
