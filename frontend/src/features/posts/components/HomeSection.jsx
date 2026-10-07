export default function HomeSection({ title, description, action = null, children }) {
  return (
    <section className="home-section space-y-4">
      <div className="home-section-header">
        <div className="min-w-0 space-y-1">
          <h2 className="home-section-title">{title}</h2>
          {description ? <p className="home-section-description">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
