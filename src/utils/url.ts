export const buildUrlQueryString = (params: Record<string, string | number | boolean | undefined>): string => {
  let result =
    Object.keys(params).length > 0
      ? Object.keys(params)
          .filter((key) => params[key] !== undefined)
          .map((key) => {
            const value = params[key];
            return `${key}=${encodeURIComponent(value)}`;
          })
          .join('&')
      : '';
  if (result) {
    result = `?${result}`;
  }
  return result;
};
