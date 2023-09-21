import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { Bank } from 'interfaces/models/game/bank';
import { useFormatCurrency } from 'hooks/utils/use-format-currency';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';

const DEFAULT_BANK: Bank = {
  serverId: '',
  amount: 0
};

const cacheKey = 'banks';

export const useBank = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateBank } = useDatabaseMutation({ cacheKey });

  const {
    data: bank,
    isLoading: isLoadingBank,
    isSuccess: hasLoadedBank,
    status: bankQueryStatus
  } = useAsyncLiveQuery<Bank | undefined, Bank>({
    queryFn: () => database.banks.where({ serverId }).first(),
    deps: [serverId],
    fallback: DEFAULT_BANK,
    cacheKey,
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
