import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useEvents, useInfo } from 'interface/guide';
import aplCheck, { Apl, CheckResult } from 'parser/shared/metrics/apl';

import AplRules, { AplRuleList } from './rules';
import ViolationProblemList, {
  AplViolationExplanations,
  AplViolationTimelineContainer,
  ExplanationSelectionContext,
  SelectedExplanation,
} from './violations';
import { AplViolationExplainers, defaultExplainers } from './violations/claims';
import { formatPercentage } from 'common/format';
import PassFailBar from 'interface/guide/components/PassFailBar';

const AplSubsectionHeader = styled.header`
  font-weight: bold;
`;

const AplSummaryTable = styled.table`
  td {
    padding-right: 1rem;
    width: 99%;
  }

  td:last-child {
    min-width: 10em;
  }
`;

const ValueData = styled.td`
  text-align: right;
`;

/**
 * Produce a summary of the APL itself. This is just an un-annotated reference.
 */
function AplSummary({ apl, results }: { apl: Apl; results: CheckResult }): JSX.Element | null {
  return (
    <div>
      <AplSubsectionHeader>Priority List</AplSubsectionHeader>
      <AplRules apl={apl} results={results} />
      <AplSubsectionHeader>Details</AplSubsectionHeader>
      <AplSummaryTable>
        <tbody>
          <tr>
            <td>Accuracy</td>
            <ValueData>
              {formatPercentage(
                results.successes.length / (results.successes.length + results.violations.length),
                1,
              )}
              %
            </ValueData>
            <td>
              <PassFailBar
                pass={results.successes.length}
                total={results.successes.length + results.violations.length}
                passTooltip={`Correct Uses: ${results.successes.length}`}
                failTooltip={`Incorrect Uses: ${results.violations.length}`}
              />
            </td>
          </tr>
          <tr>
            <td>Total Abilities Used</td>
            <ValueData>{results.successes.length + results.violations.length}</ValueData>
            <td />
          </tr>
        </tbody>
      </AplSummaryTable>
    </div>
  );
}

const AplViolationContainer = styled.div`
  display: grid;
  grid-template-rows: max-content 1fr;
`;

const AplLayout = styled.div`
  display: grid;
  grid-template-areas: 'summary problems' 'timeline timeline';
  grid-template-columns: auto 1fr;
  grid-gap: 2rem;

  ${AplRuleList} {
    grid-area: summary;
  }

  ${AplViolationContainer} {
    grid-area: problems;
  }

  ${AplViolationTimelineContainer} {
    grid-area: timeline;
  }
`;

export type AplSectionProps = {
  checker: ReturnType<typeof aplCheck>;
  apl: Apl;
  violationExplainers?: AplViolationExplainers;
};

export function AplSectionData({
  checker,
  apl,
  violationExplainers,
}: AplSectionProps): JSX.Element | null {
  const events = useEvents();
  const info = useInfo();

  const [selectedExplanation, setSelectedExplanation] = useState<
    SelectedExplanation<any> | undefined
  >(undefined);

  const result: CheckResult | undefined = useMemo(
    () => (info ? checker(events, info) : undefined),
    [events, info, checker],
  );

  if (!info || !result) {
    return null;
  }

  return (
    <ExplanationSelectionContext.Provider value={setSelectedExplanation}>
      <AplLayout>
        <AplSummary apl={apl} results={result} />
        <AplViolationContainer>
          <AplSubsectionHeader>Most Common Problems</AplSubsectionHeader>
          <AplViolationExplanations
            apl={apl}
            result={result}
            explainers={violationExplainers ?? defaultExplainers}
          />
        </AplViolationContainer>
        {selectedExplanation && (
          <ViolationProblemList {...selectedExplanation} result={result} apl={apl} />
        )}
      </AplLayout>
    </ExplanationSelectionContext.Provider>
  );
}
