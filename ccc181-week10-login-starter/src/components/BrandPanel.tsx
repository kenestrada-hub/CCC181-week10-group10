// GIVEN FILE (styled in base.css by Member 1). Do not edit.
export default function BrandPanel() {
  return (
    <section className="brand-panel" aria-labelledby="welcome-title">
      <p className="brand-panel__badge">MSU-Naawan &middot; CBIT</p>
      <h1 id="welcome-title" className="brand-panel__title">
        Welcome back to CampusConnect
      </h1>
      <p className="brand-panel__text">
        Sign in to see campus events, register in one tap, and never miss an
        update.
      </p>
      <ul className="brand-panel__perks">
        <li>Browse upcoming events by college and organization</li>
        <li>Register and get reminders on your phone</li>
        <li>Track the events you have attended</li>
      </ul>
    </section>
  );
}
