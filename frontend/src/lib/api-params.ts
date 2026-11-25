export type ParametrosApi = Record<
  string,
  string | number | boolean | undefined | null
>;

/** Quita los valores vacíos para no ensuciar la query string. */
export function limpiarParametros(
  params?: ParametrosApi,
): Record<string, string | number | boolean> {
  if (!params) return {};

  return Object.fromEntries(
    Object.entries(params).filter(
      ([, valor]) => valor !== undefined && valor !== null && valor !== "",
    ),
  ) as Record<string, string | number | boolean>;
}
