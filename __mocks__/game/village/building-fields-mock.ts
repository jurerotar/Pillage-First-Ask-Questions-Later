import { BuildingField } from 'interfaces/models/game/village';
import { villagePresets } from 'assets/village-presets';

export const newVillageBuildingFieldsMock: BuildingField[] = villagePresets.find(({ preset }) => preset === 'new-village')!.buildingFields;
