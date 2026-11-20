export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="mb-7 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
