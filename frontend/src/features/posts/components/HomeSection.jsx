export default function HomeSection({ title, children }) {
  return (
    <section className="home-section space-y-3">
      <h2 className="home-section-title">{title}</h2>
      {children}
    </section>
  );
}
