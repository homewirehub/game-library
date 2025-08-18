import React from 'react';

type Props = {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
};

export function WizardActions({
  onBack,
  onNext,
  backLabel = 'Back',
  nextLabel = 'Next →',
  nextDisabled,
}: Props) {
  if (!onBack && !onNext) return null;
  return (
    <div className="row" style={{ justifyContent: 'flex-end' }}>
      {onBack && (
        <button className="btn btn--secondary" onClick={onBack} type="button">
          {backLabel}
        </button>
      )}
      {onNext && (
        <button className="btn" onClick={onNext} type="button" disabled={nextDisabled}>
          {nextLabel}
        </button>
      )}
    </div>
  );
}

export default WizardActions;
