import { ResourceFieldId, Village } from 'interfaces/models/game/village';
import { Resources } from 'interfaces/models/game/resource';

export class GameEventService {
  public static createResourceUpgradeEvent = (villageId: Village['id'], resourceFieldId: ResourceFieldId, duration: number, upgradeCost: Resources, startTime: number) => {
    return {};
  };

  public static finishResourceFieldUpgrade = () => {

  };
}
