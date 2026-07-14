const StatusBadge = ({ confidence }) => {
  const isGood = confidence !== null && confidence !== undefined && confidence >= 85;
  const hasValue = confidence !== null && confidence !== undefined;

  if (!hasValue) {
    return (
      <span className="tag tag-muted">
        — CONFIDENCE
      </span>
    );
  }

  return (
    <span className={`tag ${isGood ? 'tag-green' : 'tag-red'}`}>
      {isGood ? '✓' : '⚠'} {Math.round(confidence)}% CONFIDENCE
    </span>
  );
};

export default StatusBadge;
