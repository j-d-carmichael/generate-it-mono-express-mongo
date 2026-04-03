export default (value: number, decimals?: number): number => {
  if (decimals === undefined) {
    return value < 0 ? Math.ceil(value) || 0 : Math.ceil(value);
  }
  return parseFloat(value.toFixed(decimals)) || 0;
};
