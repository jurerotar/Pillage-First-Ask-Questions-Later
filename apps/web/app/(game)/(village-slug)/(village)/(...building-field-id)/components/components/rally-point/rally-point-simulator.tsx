import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import {
  Controller,
  type UseFormReturn,
  useFieldArray,
  useForm,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { natureUnits } from '@pillage-first/game-assets/units';
import { getUnitsByTribe } from '@pillage-first/game-assets/utils/units';
import {
  PLAYABLE_TRIBES,
  type Tribe,
  tribeSchema,
} from '@pillage-first/types/models/tribe';
import { type Unit, unitIdSchema } from '@pillage-first/types/models/unit';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import {
  type Army,
  type BattleCasualties,
  type BattleContext,
  type BattleTroop,
  resolveBattle,
} from 'app/(game)/(village-slug)/utils/battle-resolver';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';
import { Button } from 'app/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from 'app/components/ui/form';
import { Input } from 'app/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from 'app/components/ui/toggle-group';

const simulatorRoleSchema = z.enum(['attacker', 'defender', 'reinforcements']);

const simulatorTroopSchema = z.strictObject({
  unitId: unitIdSchema,
  amount: z.coerce.number(),
  improvementLevel: z.coerce.number(),
});

const simulatorArmySchema = z.strictObject({
  tribe: tribeSchema,
  units: z.array(simulatorTroopSchema),
  role: simulatorRoleSchema,
});

const simulatorBattleSchema = z.strictObject({
  battleType: z.enum(['attack', 'raid']),
  armies: z.array(simulatorArmySchema),
  wallLevel: z.number(),
});

type SimulatorRole = z.infer<typeof simulatorRoleSchema>;
type SimulatorTroop = z.infer<typeof simulatorTroopSchema>;
type SimulatorArmy = z.infer<typeof simulatorArmySchema>;
type SimulatorBattle = z.infer<typeof simulatorBattleSchema>;

const createArmy = (tribe: Tribe, role: SimulatorRole): SimulatorArmy => {
  const unitsByTribe: Unit[] = getUnitsByTribe(tribe);
  var units: SimulatorTroop[] = unitsByTribe.map((u) => ({
    unitId: u.id,
    amount: 0,
    improvementLevel: 0,
  }));

  return {
    tribe,
    units,
    role,
  };
};

const armiesInitial: SimulatorArmy[] = [
  createArmy('romans', 'attacker'),
  createArmy('gauls', 'defender'),
];

export const RallyPointSimulator = () => {
  const { t } = useTranslation();

  const [battleResult, setBattleResult] = useState<BattleCasualties>();
  const [armies, setArmies] = useState<SimulatorArmy[]>();
  const [emptyArmyError, setEmptyArmyError] = useState<boolean>(false);

  const form = useForm<z.infer<typeof simulatorBattleSchema>>({
    resolver: zodResolver(simulatorBattleSchema),
    defaultValues: {
      armies: armiesInitial,
      battleType: 'attack',
      wallLevel: 0,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'armies',
  });

  const changeTribe = (armyIndex: number, newTribe: Tribe) => {
    var army: SimulatorArmy = form.getValues(`armies.${armyIndex}`);

    if (army.tribe === newTribe) {
      return;
    }

    const newArmy = createArmy(newTribe, army.role);
    army.units.forEach((unit, index) => {
      newArmy.units[index].amount = unit.amount;
      newArmy.units[index].improvementLevel = unit.improvementLevel;
    });

    update(armyIndex, newArmy);
  };

  const addReinforcements = () => {
    var army = createArmy('teutons', 'reinforcements');
    append(army);
  };

  const onSubmit = (values: z.infer<typeof simulatorBattleSchema>) => {
    const unitToTroop = (u: SimulatorTroop): BattleTroop => {
      const isNature =
        natureUnits.find((unit) => unit.id === u.unitId) !== undefined;
      const improvementLevel = isNature ? 0 : u.improvementLevel;

      return {
        unitId: u.unitId,
        amount: u.amount,
        improvementLevel,
      };
    };

    var attackingSimulatorArmy = values.armies.find(
      (a) => a.role === 'attacker',
    )!;
    var attackingTroops: BattleTroop[] =
      attackingSimulatorArmy.units.map(unitToTroop);
    var attackingArmy: Army = {
      tribe: attackingSimulatorArmy.tribe,
      troops: attackingTroops,
    };

    const sumAttackingUnits = attackingArmy.troops.reduce(
      (sum, unit) => sum + unit.amount,
      0,
    );
    if (sumAttackingUnits === 0) {
      setEmptyArmyError(true);
      return;
    }
    if (emptyArmyError) {
      setEmptyArmyError(false);
    }

    var defendingSimulatorArmy = values.armies.find(
      (a) => a.role === 'defender',
    )!;
    var defendingTroops: BattleTroop[] =
      defendingSimulatorArmy.units.map(unitToTroop);
    var defendingArmy: Army = {
      tribe: defendingSimulatorArmy.tribe,
      troops: defendingTroops,
    };

    const wallLevel = defendingArmy.tribe === 'nature' ? 0 : values.wallLevel;

    var battleContext: BattleContext = {
      attackingArmy,
      defendingArmy,
      battleType: values.battleType,
      wallLevel,
    };

    const battleResult = resolveBattle(battleContext);

    setBattleResult(battleResult);
    setArmies(values.armies);
  };

  return (
    <section className="flex flex-col gap-2">
      <SectionContent>
        <Bookmark tab="simulator" />
        <Text as="h2">{t('Battle Simulator')}</Text>
        <Text>
          Are you unsure about winning a battle? You want to know how many
          losses or resoureces you can expect? Just choost your army, the
          defender and reinforcements (not mandatory), and find out!
        </Text>
      </SectionContent>

      <Alert variant="warning">
        {t('This page is still under development')}
      </Alert>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-2 mt-2"
        >
          <Controller
            control={form.control}
            name="battleType"
            render={({ field: { onChange, value } }) => {
              return (
                <ToggleGroup
                  type="single"
                  variant="outline"
                  onValueChange={onChange}
                  value={value}
                  className="pointer-events-auto flex flex-wrap gap-1 sm:gap-2 rounded-md bg-background p-1 md:p-2"
                >
                  <ToggleGroupItem
                    value="attack"
                    aria-label={t('Set battle type to Attack')}
                    data-tooltip-id="general-tooltip"
                    data-tooltip-content={t('Set battle type to Attack')}
                  >
                    Attack
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="raid"
                    aria-label={t('Set battle type to Raid')}
                    data-tooltip-id="general-tooltip"
                    data-tooltip-content={t('Set battle type to Raid')}
                  >
                    Raid
                  </ToggleGroupItem>
                </ToggleGroup>
              );
            }}
          />
          {fields.map((field, index) => (
            <div key={field.id}>
              <ArmyConstructor
                changeTribe={changeTribe}
                army={field}
                armyIndex={index}
                form={form}
              />
              {field.role === 'attacker' && emptyArmyError && (
                <div className="py-2">
                  <ErrorBag
                    errorBag={['The attacking army must have at least 1 unit']}
                  />
                </div>
              )}
              {field.role === 'reinforcements' && (
                <Button onClick={() => remove(index)}>Delete</Button>
              )}
            </div>
          ))}
          <Button
            size="fit"
            onClick={addReinforcements}
          >
            {t('Add reinforcements')}
          </Button>
          <Button
            size="fit"
            type="submit"
          >
            {t('Simulate')}
          </Button>
        </form>
      </Form>
      {battleResult && (
        <BattleResultTable
          battleResult={battleResult}
          armies={armies}
        />
      )}
    </section>
  );
};

type BattleResultTable = {
  battleResult: BattleCasualties;
  armies: SimulatorArmy[];
};

const BattleResultTable = ({ battleResult, armies }: BattleResultTable) => {
  const { t } = useTranslation();

  return (
    <div>
      {armies.map((army, index) => {
        var casualtyRate =
          army.role === 'attacker'
            ? battleResult.attackerCasualtyRate
            : battleResult.defenderCasualtyRate;

        return (
          <div
            className="py-2 overflow-x-scroll"
            // biome-ignore lint/suspicious/noArrayIndexKey: It's a static list, it's fine
            key={index}
          >
            <BattleResultArmyTable
              army={army}
              casualtyRate={casualtyRate}
            />
          </div>
        );
      })}

      <Table className="overflow-x-scroll">
        <TableHeader>
          <TableRow>
            <TableHeaderCell
              colSpan="100%"
              className="text-left"
            >
              <Text>{t('Statistics')}</Text>
            </TableHeaderCell>
          </TableRow>
        </TableHeader>

        <TableBody>
          <TableRow>
            <TableCell className="text-center" />
            <TableCell className="text-center">{t('Attacker')}</TableCell>
            <TableCell className="text-center">{t('Defender')}</TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="text-center">
              {t('Combat strength')}
            </TableCell>
            <TableCell className="text-center">
              {Math.round(battleResult.totalAttackPoints)}
            </TableCell>
            <TableCell className="text-center">
              {Math.round(battleResult.totalDefencePoints)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

type BattleResultArmyTable = {
  casualtyRate: number;
  army: SimulatorArmy;
};

const BattleResultArmyTable = ({
  casualtyRate,
  army,
}: BattleResultArmyTable) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHeaderCell
            colSpan="100%"
            className="text-left"
          >
            <Text className="capitalize">{army.role}</Text>
          </TableHeaderCell>
        </TableRow>
      </TableHeader>

      <TableBody>
        <TableRow>
          <TableCell className="text-center" />
          {army.units.map((unit) => {
            return (
              <TableCell
                className="text-center"
                key={unit.unitId}
              >
                <Icon
                  type={unitIdToUnitIconMapper(unit.unitId)}
                  className="size-4 lg:size-6 m-auto"
                />
              </TableCell>
            );
          })}
        </TableRow>

        <TableRow>
          <TableCell className="text-center">Initial</TableCell>
          {army.units.map((unit) => {
            return (
              <TableCell
                className="text-center"
                key={unit.unitId}
              >
                {unit.amount}
              </TableCell>
            );
          })}
        </TableRow>

        <TableRow>
          <TableCell className="text-center">Casualties</TableCell>
          {army.units.map((unit) => {
            return (
              <TableCell
                className="text-center text-red-500"
                key={unit.unitId}
              >
                {Math.round(unit.amount * casualtyRate)}
              </TableCell>
            );
          })}
        </TableRow>

        <TableRow>
          <TableCell className="text-center">Remaining</TableCell>
          {army.units.map((unit) => {
            return (
              <TableCell
                className="text-center text-green-700"
                key={unit.unitId}
              >
                {unit.amount - Math.round(unit.amount * casualtyRate)}
              </TableCell>
            );
          })}
        </TableRow>
      </TableBody>
    </Table>
  );
};

type ArmyConstructorProps = {
  changeTribe: (armyIndex: number, newTribe: Tribe) => void;
  form: UseFormReturn<SimulatorBattle>;
  army: SimulatorArmy;
  armyIndex: number;
};

const attackTribes = PLAYABLE_TRIBES.concat('natars');
const defendTribes = PLAYABLE_TRIBES.concat('natars', 'nature');
const reinforcementTribes = PLAYABLE_TRIBES.concat('nature');

const ArmyConstructor = ({
  changeTribe,
  form,
  army,
  armyIndex,
}: ArmyConstructorProps) => {
  const { t } = useTranslation();

  const changeTribeSelection =
    army.role === 'attacker'
      ? attackTribes
      : army.role === 'defender'
        ? defendTribes
        : reinforcementTribes;

  const unitsByTribe = getUnitsByTribe(army.tribe);
  return (
    <div className="border border-border p-2">
      <Text
        as="h2"
        className="capitalize"
      >
        {t(army.role)}
      </Text>
      <ToggleGroup
        type="single"
        variant="outline"
        onValueChange={(newTribe) => changeTribe(armyIndex, newTribe)}
        value={army.tribe}
        className="pointer-events-auto flex w-full gap-1 sm:gap-2 rounded-md bg-background py-2 sm:py-3 overflow-x-scroll"
      >
        {changeTribeSelection.map((tribe) => (
          <ToggleGroupItem
            className="min-w-20"
            key={tribe}
            value={tribe}
          >
            {t(`TRIBES.${tribe.toUpperCase()}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="overflow-x-scroll">
        <Table>
          <TableBody>
            <TableRow border={false}>
              <TableCell border={false} />
              {unitsByTribe.map(({ id }) => (
                <TableCell
                  border={false}
                  className="text-center"
                  key={id}
                >
                  <Icon
                    type={unitIdToUnitIconMapper(id)}
                    className="size-4 lg:size-6 m-auto"
                  />
                </TableCell>
              ))}
            </TableRow>

            <TableRow border={false}>
              <TableCell border={false}>#</TableCell>
              {unitsByTribe.map(({ id }, unitIndex) => {
                return (
                  <TableCell
                    border={false}
                    variant="wide"
                    className="text-center"
                    key={id}
                  >
                    <FormField
                      control={form.control}
                      name={`armies.${armyIndex}.units.${unitIndex}.amount`}
                      render={({ field }) => {
                        return (
                          <FormItem>
                            <FormControl>
                              <Input
                                hideSpinner
                                placeholder="0"
                                className="max-w-20 min-w-10 text-center"
                                size="fit"
                                type="number"
                                min={0}
                                {...form.register(
                                  `armies.${armyIndex}.units.${unitIndex}.amount`,
                                  {
                                    valueAsNumber: true,
                                  },
                                )}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        );
                      }}
                    />
                  </TableCell>
                );
              })}
            </TableRow>

            {army.tribe !== 'nature' && (
              <TableRow>
                <TableCell border={false}>
                  <Icon type="positiveChange" />
                </TableCell>

                {unitsByTribe.map(({ id }, unitIndex) => {
                  return (
                    <TableCell
                      border={false}
                      variant="wide"
                      className="text-center"
                      key={id}
                    >
                      <FormField
                        control={form.control}
                        name={`armies.${armyIndex}.units.${unitIndex}.improvementLevel`}
                        render={({ field }) => {
                          return (
                            <FormItem>
                              <FormControl>
                                <Input
                                  hideSpinner
                                  size="fit"
                                  placeholder="0"
                                  className="max-w-20 min-w-10 text-center"
                                  type="number"
                                  min={0}
                                  max={20}
                                  {...form.register(
                                    `armies.${armyIndex}.units.${unitIndex}.improvementLevel`,
                                    {
                                      valueAsNumber: true,
                                    },
                                  )}
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          );
                        }}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            )}
          </TableBody>
        </Table>
        {army.role === 'defender' && army.tribe !== 'nature' && (
          <div className="flex gap-2 py-2">
            <FormLabel>Wall level:</FormLabel>
            <FormItem>
              <FormControl>
                <Input
                  placeholder="0"
                  className="max-w-15 min-w-10 text-center"
                  size="fit"
                  type="number"
                  min={0}
                  max={20}
                  {...form.register('wallLevel', {
                    valueAsNumber: true,
                  })}
                />
              </FormControl>
            </FormItem>
          </div>
        )}
      </div>
    </div>
  );
};
