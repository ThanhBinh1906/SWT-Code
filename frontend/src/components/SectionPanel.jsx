export function SectionPanel({ title, description, actions, children }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className="panel__actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
