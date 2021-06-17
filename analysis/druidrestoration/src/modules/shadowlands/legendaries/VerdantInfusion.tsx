import { formatNumber } from 'common/format';
import SPELLS from 'common/SPELLS';
import Analyzer, { Options, SELECTED_PLAYER } from 'parser/core/Analyzer';
import Events, { CastEvent } from 'parser/core/Events';
import Combatants from 'parser/shared/modules/Combatants';
import HotTracker, { Attribution, TrackersBySpell } from 'parser/shared/modules/HotTracker';
import BoringSpellValueText from 'parser/ui/BoringSpellValueText';
import ItemPercentHealingDone from 'parser/ui/ItemPercentHealingDone';
import Statistic from 'parser/ui/Statistic';
import STATISTIC_CATEGORY from 'parser/ui/STATISTIC_CATEGORY';
import STATISTIC_ORDER from 'parser/ui/STATISTIC_ORDER';
import React from 'react';

import HotTrackerRestoDruid from '../../core/hottracking/HotTrackerRestoDruid';

const HOT_EXTENSION = 10_000;

const HOT_ID_CONSUME_ORDER = [
  SPELLS.REGROWTH.id,
  SPELLS.WILD_GROWTH.id,
  SPELLS.REJUVENATION.id,
  SPELLS.REJUVENATION_GERMINATION.id,
];

/**
 * **Verdant Infusion**
 * Runecarving Legendary
 *
 * Swiftmend no longer consumes a heal over time effect,
 * and extends the duration of your heal over time effects on the target by 10 sec.
 */
class VerdantInfusion extends Analyzer {
  static dependencies = {
    hotTracker: HotTrackerRestoDruid,
    combatants: Combatants,
  };

  hotTracker!: HotTrackerRestoDruid;
  combatants!: Combatants;

  attribution: Attribution = HotTracker.getNewAttribution('Verdant Infusion');
  casts: number = 0;

  constructor(options: Options) {
    super(options);
    this.active = this.selectedCombatant.hasLegendaryByBonusID(SPELLS.VERDANT_INFUSION.bonusID);

    this.addEventListener(
      Events.cast.by(SELECTED_PLAYER).spell(SPELLS.SWIFTMEND),
      this.onSwiftmend,
    );
  }

  onSwiftmend(event: CastEvent) {
    this.casts += 1;
    const target = this.combatants.getEntity(event);
    if (!target) {
      return;
    }
    const hotsOn: TrackersBySpell = this.hotTracker.hots[target.id];
    if (!hotsOn) {
      return;
    }
    const hotIdsOn: number[] = Object.keys(hotsOn).map((hotId) => Number(hotId));

    const hotIdThatWouldHaveBeenRemoved: number | undefined = HOT_ID_CONSUME_ORDER.find((hotId) =>
      hotIdsOn.includes(hotId),
    );

    hotIdsOn.forEach((hotId) => {
      if (hotId === hotIdThatWouldHaveBeenRemoved) {
        // register extension, but attribute the whole HoT to VI
        this.hotTracker.addExtension(null, HOT_EXTENSION, target.id, hotId);
        this.hotTracker.addAttribution(this.attribution, target.id, hotId);
      } else {
        // register and attribute the extension
        this.hotTracker.addExtension(this.attribution, HOT_EXTENSION, target.id, hotId);
      }
    });
  }

  get healingPerCast() {
    return this.casts === 0 ? 0 : this.attribution.healing / this.casts;
  }

  get extensionsPerCast() {
    return this.casts === 0 ? 0 : this.attribution.procs / this.casts;
  }

  statistic() {
    return (
      <Statistic
        position={STATISTIC_ORDER.OPTIONAL(13)}
        size="flexible"
        category={STATISTIC_CATEGORY.COVENANTS}
        tooltip={
          <>
            This is the sum of the healing attributable to the HoT extensions caused by casting
            Swiftmend with the Verdant Infusion legendary. This number also accounts for the benefit
            of not consuming a HoT.
            <br />
            <br />
            Over <strong>{this.casts} Swiftmends</strong>, you averaged{' '}
            <strong>{this.extensionsPerCast.toFixed(1)} HoTs extended</strong> and caused{' '}
            <strong>{formatNumber(this.healingPerCast)} additional healing</strong> per cast.
          </>
        }
      >
        <BoringSpellValueText spell={SPELLS.VERDANT_INFUSION}>
          <ItemPercentHealingDone amount={this.attribution.healing} />
          <br />
        </BoringSpellValueText>
      </Statistic>
    );
  }
}

export default VerdantInfusion;
