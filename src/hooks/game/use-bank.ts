import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { Bank } from 'interfaces/models/game/bank';
import { useFormatCurrency } from 'hooks/utils/use-format-currency';

const DEFAULT_BANK: Bank = {
  amount: 0
};

export const useBank = () => {
  const { serverId } = useCurrentServer();

  const {
    data: bank,
    isLoading: isLoadingBank,
    isSuccess: hasLoadedBank,
    status: bankQueryStatus
  } = useAsyncLiveQuery<Bank>(async () => {
    return database.bank.where({ serverId }).first();
  }, [serverId], DEFAULT_BANK);

  const { amount } = bank;

  const { cooper, silver, gold } = useFormatCurrency(amount);

  return {
    bank,
    isLoadingBank,
    hasLoadedBank,
    bankQueryStatus,
    amount,
    cooper,
    silver,
    gold
  };
};
