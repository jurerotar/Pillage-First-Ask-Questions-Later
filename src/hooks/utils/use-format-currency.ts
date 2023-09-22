export const useFormatCurrency = (amount: number) => {
  const cooper = amount % 100;
  let temp = (amount - cooper) / 100;
  const silver = temp % 100;
  temp = (temp - silver) / 100;

  return {
    cooper,
    silver,
    gold: temp
  };
};
