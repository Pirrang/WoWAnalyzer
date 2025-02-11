import { SpellLink } from 'interface';
import SPELLS from 'common/SPELLS/demonhunter';
import { Trans } from '@lingui/macro';
import { TALENTS_DEMON_HUNTER } from 'common/TALENTS';
import { useInfo } from 'interface/guide';

interface Props {
  lineBreak?: boolean;
}
const DemonicExplanation = ({ lineBreak }: Props) => {
  const info = useInfo();
  if (!info || !info.combatant.hasTalent(TALENTS_DEMON_HUNTER.FURIOUS_GAZE_TALENT)) {
    return null;
  }
  return (
    <>
      {lineBreak ? <br /> : ' '}
      <Trans id="guide.demonhunter.havoc.furiousGaze.explanation">
        It will grant <SpellLink id={SPELLS.FURIOUS_GAZE} /> for a short duration when cast due to{' '}
        <SpellLink id={TALENTS_DEMON_HUNTER.FURIOUS_GAZE_TALENT} />.
      </Trans>
    </>
  );
};

export default DemonicExplanation;
