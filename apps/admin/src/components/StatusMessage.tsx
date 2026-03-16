interface StatusMessageProps {
  error?: string | null;
  success?: string | null;
}

export function StatusMessage({ error, success }: StatusMessageProps) {
  if (!error && !success) return null;

  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: 'var(--radius)',
        fontSize: '0.85rem',
        marginBottom: 12,
        background: error
          ? 'rgba(231, 76, 94, 0.12)'
          : 'rgba(52, 199, 123, 0.12)',
        color: error ? 'var(--danger)' : 'var(--success)',
        border: `1px solid ${error ? 'var(--danger)' : 'var(--success)'}`,
      }}
    >
      {error || success}
    </div>
  );
}
