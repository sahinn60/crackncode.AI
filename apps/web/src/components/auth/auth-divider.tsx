export function AuthDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="relative my-5 flex items-center">
      <div className="flex-1 border-t border-border" />
      <span className="mx-3 text-xs text-muted-foreground">{label}</span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}
