import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Bank } from 'interfaces/models/game/bank';
import { useFormatCurrency } from 'hooks/utils/use-format-currency';
import { Server } from 'interfaces/models/game/server';
import { useQuery } from '@tanstack/react-query';

export const banksCacheKey = 'banks';

export const getBank = (serverId: Server['id']) => database.banks.where({ serverId }).first() as Promise<Bank>;

export const useBank = () => {
  const { serverId } = useCurrentServer();

  const {
    data: bank,
    isLoading: isLoadingBank,
    isSuccess: hasLoadedBank,
    status: bankQueryStatus,
  } = useQuery<Bank>({
    queryKey: [banksCacheKey, serverId],
    queryFn: () => getBank(serverId),
  });

  const { amount } = bank!;

  const { cooper, silver, gold } = useFormatCurrency(amount);

  return {
    bank,
    isLoadingBank,
    hasLoadedBank,
    bankQueryStatus,
    amount,
    cooper,
    silver,
    gold,
  };
};
