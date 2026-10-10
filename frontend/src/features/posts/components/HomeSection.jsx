export default function HomeSection({
  title,
  description,
  action = null,
  className = "",
  children,
}) {
  const sectionClassName = ["home-section", className].filter(Boolean).join(" ");

  return (
    <section className={sectionClassName}>
      <div className="home-section-header">
        <div className="home-section-heading">
          <h2 className="home-section-title">{title}</h2>
          {description ? <p className="home-section-description">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="home-section-body">{children}</div>
    </section>
  );
}
