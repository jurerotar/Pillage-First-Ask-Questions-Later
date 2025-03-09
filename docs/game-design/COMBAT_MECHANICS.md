# Combat mechanics

All this text is taken from the following links. This document duplicates this text in case the original gets removed.

https://blog.travian.com/ru/2023/09/game-secrets-combat-system-formulas-written-by-kirilloid/
https://blog.travian.com/2023/10/game-secrets-combat-bonuses-own-village-defense/
https://blog.travian.com/2023/10/game-secrets-smithy-and-total-strength-of-an-army/
https://math.stackexchange.com/questions/3238329/cant-understand-ram-formula

## Offense and defense points

In Travian, every unit has some strength in attack and defense. Its offense points are its attack skill. The more offense points a unit has, the more enemies it will kill, when used in attack . The same is true for defense, except there are two types: defense against infantry and defense against cavalry .

E.g. praetorians (65/35 def) are better against infantry, just as spearmen (35/60 def) are better against cavalry.

In combat, only the offense points of attacker and defense points of defenders are taken into account. Attacking with praetorians isn’t effective despite their high defense value. Similarly, clubswingers are worse on defense. So use your troops wisely, only for purposes they’re well-suited. Otherwise you’ll lose easily!

Even with knowledge about units’ stats, you cannot easily predict combat result, because the combat system is neither simple nor trivial.

Players with can find a rather good combat simulator in their rally point. This extended version allows them taking into account almost all values affecting battle result.

There are several free combat simulators online. One of the most famous free warsims is mine. It has an almost equal set of features as the full in-game warsim plus a few: convenient hero use, traps in Gallic village, battles with Natars, some artifacts and two targets for catapults.

Also, my warsim has another useful feature: it tracks which units you have input in the URL. If you copy the URL from the address bar and send it to somebody, after opening this URL, they will go to the simulator’s page, where all troops are already set to the same values as you just done.

## Raid / normal attack

Here, I describe common combat without any bonuses like walls, upgrades, etc. As mentioned, we only take offense points from attacking army and defense points from the defending army.

First, count total offense and defense points. Total points are just amount of troops multiplied by corresponding unit stat.

For instance, we attack with 100 imperians and 50 legionnaires. Their attack values are 70 and 40 respectively, so total offense points will be:

100 · 70 + 50 · 40 = 9000 (1)

Let the defender have 150 phalanx. As all the attacking troops in our example are infantry, we will use only defense against infantry, 40. In this case total defense points are:

150 · 40 = 6000 (2)

Consider first a normal attack, combat will continue until one side is completely destroyed. We determine the loser by comparing total offense and defense points. In our example, 9000 (1) is more than 6000 (2), so the defender will lose.

Winner’s casualties are determined by next formula:

100% · (loser_points / winner_points)^1.5 (3)
since the defender loses this battle, loser_points = 6000 and winner_points = 9000.

100% · (6000 / 9000)^1.5 ≈ 100% · 0.5443 = 54.43%
So 54.43% of attackers will die. This fraction is the same for all different types of troops. Since the attacker had 100 imperians and 50 legionnaires,  they lost 100 · 0.5443 = 54.43 (54 rounded) imperians and 0.5443 · 50 = 27.21 (27 rounded) legionnaires.

Amounts are rounded for each type of troops separately, not all up or all down.

For raids, the formula changes a bit, losses will be:

100% · x / (100% + x) where x is determined by formula mentioned above (3).

This calculates the losses of the winner. The loser’s casulaties will be (100% – winner’s losses).

Consider another example: 100 imperians raiding 100 praetorians. Offense points (7000) are greater than defense points (6500), so the attacker wins again.

x = 100% · (6500 / 7000)^1.5 ≈ 89.479%

100% · 89.479% / 189.479% ≈ 47.22%

So 47.22% from 100 or just 47 imperians will die. Defender will lose 100% – 47.22% = 52.78% of his/her army, i.e. 53 praetorians.

The winner’s casualties formula is actually more complicated, but only applies when large armies take part in combat. The formula is a bit different and the winner takes more casualties.
Instead of the standard formula (3), another one is used:

100% · (loser_points / winner_points)^K (4)
where K depends on how much soldiers were involved in combat. Really, large, immense battles should differ from small battles between hundreds of soldiers.
К is determined by next formula:
2 · (1.8592 – N^0.015) (5)
where N is total amount of units taking part in battle (unit count, not their wheat upkeep).

1.2578 ≤ К ≤ 1.5: When the total number of units is one thousand or less K = 1.5, and if the total number is larger than one billion (not exact) K = 1.2578.

E.g., 2000 haeduans attacks 1400 phalanx. N = 2000 + 1400 = 3400

К = 2 · (1.8592 – 3400^0.015) = 2 · (1.8592 – 1.1297) = 2 · 0.7295 = 1.459
So the formula for losses (attacker wins obviously) will look like: 100% · (def_points / off_points)^1.459
2000 haeduans have 2000·140 = 280,000 offense points

1400 phalanx have 1400·50 = 70,000 offense points, since the attackers are cavalry troops, we will use phalanx’s defense against cavalry.

100% · (70,000 / 280,000)^1.459 = 100% · 0.25^1.459 ≈ 13.23%
2000 · 13.23% ≈ 265, i.e. 265 haeduans die.

## Simple combat with mixed infantry/cavalry

How do we calculate defense points if the attacker has both infantry and cavalry troops? Offense points are calculated the same way, but determining of defense points become non-trivial. In such a case, the defense points are calculated proportional to infantry/cavalry offense ratio.

For instance, 100 theutates thunders and 50 swordsmen are attacking 100 praetorians.

Offense points are equal: 100 · 100 + 50 · 65 = 10000 + 3250 = 13,250

From more then thirteen thousand offense points, cavalry part is 10000, and remainder is infantry part. We need to get proportion, so we divide:

10000 / 13,250 ≈ 0.7547
and do the same for infantry:

3250 / 13250 ≈ 0.2453
Therefore, 75.47% of offense points are cavalry offense points, and 24.53% infantry points (sum should be equal to 100%, if we are not mistaken).

Then we «apply» this infantry/cavalry proportion to defender’s troops. Praetorian has 65 def.points against infantry and 35 def against cavalry, i.e. total army’s defense is:

100 · 65 = 6500 (infantry)
100 · 35 = 3500 (cavalry)
To get real defense points we need to combine these points by proportion:

0,7547 · 3500 + 0,2453 · 6500 = 2 641.4 + 1 594,4 ≈ 4 236
Therefore, praetorians will have 4 236 defense points against such attacking army.

Now we got offense and defense points so could apply formulas we already know: 13250 > 4236, meaning attacker will win and defender will lose all his/her troops:

100% · (4236 / 13250)^1.5 ≈ 18.08%
Attacker will lose 18.08% of all of their own troops, which works out 100 · 0,1808 = 18 theutates thunders and 50 · 0,1807 = 9 swordsmen.

## Wall

The wall gives the defender an extra percentage bonus, which depends on the tribe of wall and its level:

1.020^L for the Teutonic Earth wall;
1.025^L for the Gallic Palisade;
1.030^L for the Roman City wall.
1.025^L for the Egyptian Stone Wall
1.015^L for the Hun Makeshift Wall
1.020^L for the Spartan defensive wall.
where L is level of corresponding building.

E.g. a level 15 Roman city wall gives this bonus: 1.03^15 = 1.558 or 55.8%. At level 20 the bonus is a bit more than 80%. Therefore, the wall is a cornerstone in a village’s defense.

Consider 150 swordsmen attacking 100 praetorians and 25 legionnaires behind a level 15 city wall.
Since swordsmen are infantry we will use only defense against infantry values.
offense points will be: 150 · 65 = 9750
defense points will be: 25 · 35 + 100 · 65 = 7375
But we have a wall, which could greatly increase defense points: 7375 · 1.558 ≈ 11490

11490 is greater than 9750, so in this example the defender will win.
casualties = 100% · (9750 / 11490) ^ 1.5 = 78.17% which result in 78 praetorians and 20 legionnaires lost.
If there’s no wall, the attacker would win. You may check it with the combat simulator.

*Watchtowers: In Annual Special scenario with the city feature there is possibility to enhance wall with the Watchtowers. Each level of watchtowers adds an additional 1% of defense bonus to all units defending the city. This is a flat bonus added separately from the wall bonus. This means that for example on level 10 it increases defensive units strength by exactly 10%.

## Basic village defense

Even an empty village with no fortification has a small defense value (10). Moreover, this value is also affected by other bonuses, like the wall. I was not completely honest with you, omitting this value in previous calculations. This was done for the sake of simplicity and because such small value rarely can affect result of average combat.

E.g. 2 phalanx attacks empty village.
offense is 15·2 = 30
defense is 10
2 · (10/30)^1.5 ≈ 0.385 which leads to no casualties.
But if we build in an empty (I mean no troops) roman village a 5th level wall, the combat result will change.
defense become 10·1.03^5 or 12 points
2 · (12/30)^1.5 ≈ 0.506 which will be rounded to 1 and will mean 1 dead phalanx.

Also there’s one extra tricky aspect. There’s a known phenomenon that one unit will always die against even an empty village, unless it was a strong cavalry unit. It could be described by basic defense. However, why does one imperian with 70 offense points die and 2 phalanx with total 30 offense points don’t?

That’s because there’s an extra check for every combat with a lone attacker.
If unit’s offense points are less than 83, unit will die disregarding of defender’s losses. This check is applied for both attack types: normal attack/raid.

## Residence/Palace/Command Centre

Residence/Palace (we will use just “Palace” hereinafter, since all 3 buildings are equal in their defending abilities) also help in combat, but its contribution isn’t much. The Palace doesn’t add percent-based bonus, but just adds some absolute defense value: e.g., on 20th level Palace will give only 800 defense points (both against infantry and cavalry). This addition is expressed by the following formula:

2 · n^2 (6) where n is the level of the palace.

As we could see, first levels give you nearly nothing. E.g., 1st level Palace adds only 2 points, 2nd level — 8pts, 3rd level — 18pts, etc.

Against large armies, even 800 points is a tiny value, but against small squadrons it may be useful. If 10 imperians attack a village with a 20th level palace, they all die! (700 < 800+10). Of course, it is not easy to obtain the benefits from these buildings, since even a level 5 residence isn’t very cheap. And when you have enough resources, armies are far stronger than 10 imperians.

Hint: Defense given by palace and basic village defense is affected by the wall bonus just like troops.
15 phalanx attacks village with 6th level residence and 6th level roman wall.
offense is 15 · 15 = 225
defense is (Residence + base defense) · Wall bonus = (2·6^2 + 10) · (1.03^6) ≈ 82 · 1.194 ≈ 98

Attacker wins, but since the residence can’t be destroyed by regular troops, the attacker loses something while the defender loses nothing.
100% · (98/225) ^ 1.5 ≈ 28.7% or 4 phalanx

## Smithy upgrade formula

improved_value = BASE_VALUE + (BASE_VALUE + 300 · UPKEEP / 7) · (1.007^LEVEL – 1)

It is correct for every stat (offense, def. against infantry, def. against cavalry), for any tribe and for any unit.

Note: Base upkeep is always used. Neither artifacts, the WW village, nor the Horse Drinking Trough affects Smithy upgrades.

As always, consider an example:

20,000 clubswingers, fully upgraded in smithy (lvl20) attack 12,000 non-improved praetorians.
According to formula above

improved_value = 40 + (40 + 300 · 1 / 7) · (1.007^20 – 1) ≈ 40 + (40 + 42.8571) · 0.149713 = 52.4048
offense points will be: 20,000 · 52.4048 = 1,048,096
defense points will be: 12,000 · 65 = 780,000
total amount of troops is 32,000, so according to immensity of battle will be
K = 2 · (1.8592 – 32,000^0.015) = 2 · (1.8592 – 1.1684) = 2 · 0.6908 = 1.3816
losses will be 100% · (780,000 / 1,048,096) ^ 1.3816 = 66.486% or 13297 clubswingers

## Other bonuses

Apart from the smithy upgrades the game has various other bonuses and even one malus that might affect the game result. The formula of the total army strength is based on a simple multiplying.

Total strength for a certain unit = (smithy’d base attack + weapon bonus) * amount of units

Total strength for an army = (total strength for each unit in this army + equipped hero strength) * hero attacking or defensive bonus * Natar horn bonus (if a Horn of Natars is present and it’s attack against Natars) * brewery attack bonus (if a player has a Teuton capital with an active brewery celebration) * alliance metallurgy bonus * 0.5 payment ban 50% penalty (if a player is banned for payment).

## Rams

In the first stage, the ram replaces the wall's current level with a lower computed "virtual level", as if it were dealing actual damage. To compute the virtual level, use the formula (10). Formula (10) relates the number of attacking rams required to completely destroy the wall ("DDR") to the level and defensive factors of the wall. (It should also take into account the upgrade level, as catapults do in equation (8), but I don't see that factor here.)

As with equation (8) for catapults, equation (10) tells you how many attacking rams it takes to completely destroy the wall. I infer that "completely destroy the wall" means reduce its level to 0, and that if you have a fraction of that many rams, you reduce the wall's level by the same fraction of its total amount.

The chart, in any case, depicts the relationship between the wall's starting level and virtual level. It is a plot showing how number of actual attacking rams (vertical axis) and the current level of the wall (curves show current level 10,15,20) relate to the wall's computed virtual level (horizontal axis). This may be just a plot of equation (10), but I have not plotted it to find out.

Once you've computed how low the wall's virtual level is, you conduct combat as usual. You use the virtual level instead of the wall's actual level when computing stats such as defensive bonus for troops.

The post leaves several things unclear, but my best guess is as follows:

The ram casualties are determined using the usual casualty formula; just remember that the walls will use their virtual level when determining the defense bonus.

The wall's level is reduced according to formula (10). I suspect the level reduction is computed in the second stage (or else why call the level loss "virtual level loss".) The level reduction is given by formula (10).
