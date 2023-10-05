import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { Bank } from 'interfaces/models/game/bank';
import { useFormatCurrency } from 'hooks/utils/use-format-currency';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';
import { Server } from 'interfaces/models/game/server';

const DEFAULT_BANK: Bank = {
  serverId: '',
  amount: 0
};

export const banksCacheKey = 'banks';

export const getBank = (serverId: Server['id']) => database.banks.where({ serverId }).first();

export const useBank = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateBank } = useDatabaseMutation({ cacheKey: banksCacheKey });

  const {
    data: bank,
    isLoading: isLoadingBank,
    isSuccess: hasLoadedBank,
    status: bankQueryStatus
  } = useAsyncLiveQuery<Bank | undefined, Bank>({
    queryFn: () => getBank(serverId),
    deps: [serverId],
    fallback: DEFAULT_BANK,
    cacheKey: banksCacheKey,
    enabled: hasLoadedServer
  });

  const { amount } = (bank!);

  const {
    cooper,
    silver,
    gold
  } = useFormatCurrency(amount);

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
