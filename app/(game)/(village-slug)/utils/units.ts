import type { Unit } from 'app/interfaces/models/game/unit';
import { unitsMap } from 'app/(game)/(village-slug)/assets/units';
import type { Resource, Resources } from 'app/interfaces/models/game/resource';

export const getUnitData = (unitId: Unit['id']): Unit => {
  return unitsMap.get(unitId)!;
};

export const calculateMaxUnits = (resources: Resources, costs: number[]): number => {
  const resourceKeys: Resource[] = ['wood', 'clay', 'iron', 'wheat'];

  const maxUnitsPerResource = resourceKeys.map((resource, index) =>
    costs[index] > 0 ? Math.floor(resources[resource] / costs[index]) : Number.POSITIVE_INFINITY,
  );

  return Math.min(...maxUnitsPerResource);
};

// var researchCostCoeffs = ((()=> {
//   var stdCost = {
//       b: [100, 100, 200, 160],
//       k: [6, 4, 8, 6],
//       t: 3
//     },
//     adminCost = {
//       k: [0.5, 0.5, 0.8, 0.6],
//       b: [500, 200, 400, 160],
//       t: 0.25
//     },
//     nullCost = {
//       k: [0, 0, 0, 0],
//       b: [0, 0, 0, 0],
//       t: 0
//     };
//   return [stdCost, stdCost, stdCost, stdCost, stdCost, stdCost, stdCost, stdCost, adminCost, nullCost];
// })());
//
// function unitUpgradeCost(lvl) {
//   var c = Math.pow(lvl, 0.8),
//     u;
//   if (!this.upgCost) {
//     u = this.cu;
//     this.upgCost = this.cost.map((val, idx)=> (val * 7 + b[idx]) / u);
//   }
//   return this.upgCost.map((e) => Round5(e * c));
// }
//
// var CC = 450;
//
// function rebuildUpgs(unit_stats) {
//   var result = [[],[]], // 21
//     r, l;
//   for (r = 0; r < 4; r++) {
//     result[0][r] = k[r] * unit_stats.cost[r] + b[r];
//     result[1][r] = (unit_stats.cost[r] * 7 + b[r]) / unit_stats.cu;
//   }
//   for (l = 20; l > 1; l--) {
//     if (!result[l]) { result[l] = []; }
//     for (r = 0; r < 4; r++) {
//       result[l][r] = Round5(result[1][r] * coeff[l]);
//     }
//   }
//   return result;
// }
//
// function rebuildUpgTime(_unit_stats, _smith_lvl, _spd) {
//   var r0, r1, l,
//     result = [
//       r0 = timeS2R(_unit_stats.rs_time) / _spd,
//       r1 = r0 * Math.pow(0.964, _smith_lvl-1)
//     ];
//   for (l = 2; l <= 20; l++) {
//     result.push(r1 * coeff[l]);
//   }
//   return result;
// }
//
// function cost_upg(_unit_stats, lvl) {
//   var r,
//     result = [];
//   for (r = 0; r < 4; r++) {
//     result.push(Round5(
//       coeff[lvl] * (_unit_stats.cost[r] * 7 + b[r]) / _unit_stats.cu
//     ));
//   }
//   return result;
// }
//
// function calc_upg(_unit_stats, type, lvl) {
//   return Combat.upgrade(_unit_stats, type, lvl);
// }
//
// function calc_at(_unit_stats, type, lvl) {
//   return sum(cost_upg(_unit_stats, lvl+1)) * calc_upg(_unit_stats, type, lvl) /
//     ((sum(_unit_stats.cost) + CC*_unit_stats.cu) * (calc_upg(_unit_stats, type, lvl+1) - calc_upg(_unit_stats, type, lvl)));
// }
//
// function rebuildUnitMethod(fn, max) {
//   return (_unit_stats) => {
//     var result = [], lvl;
//     var props = ['off', 'def_i', 'def_c', '%reserverd%', 'scan', 'def_s', 'dmlsh'].filter((name, idx) => _unit_stats.mask & (1 << idx));
//     for (lvl = 0; lvl < max; lvl++) {
//       result.push(props.map((name) => fn(_unit_stats, name, lvl)));
//     }
//     return result;
//   };
// }
// var rebuildUnitStats = rebuildUnitMethod(calc_upg, 21),
//   rebuildUnitAt = rebuildUnitMethod(calc_at, 20);
//
// function calcUnits(unit_cost, res) {
//   var sum = 0,
//     tc = 0,
//     r;
//   for (r = 0; r < 4; r++) {
//     tc += unit_cost[r];
//     sum += res[r];
//   }
//   var result = {
//     nr: sum / tc,
//     res: [0,0,0,0]
//   };
//   var accum = 0;
//   for (r = 0; r < 4; r++) {
//     accum += unit_cost[r] * result.nr;
//     result.res[r] = Math.round(accum);
//   }
//   for (r = 3; r > 0; r--) {
//     result.res[r] -= result.res[r - 1];
//   }
//   return result;
// }
