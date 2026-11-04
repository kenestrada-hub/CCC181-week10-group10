// GIVEN FILE (styled in nav.css by Member 2). Do not edit.
const links = [
  { label: 'Home', href: '#home' },
  { label: 'Events', href: '#events' },
  { label: 'Help', href: '#help' },
  { label: 'Register', href: '#register' },
];

export default function Navbar() {
  return (
    <header className="site-header">
      <nav className="navbar container" aria-label="Main">
        <a className="navbar__brand" href="#home">
          CampusConnect
        </a>
        <ul className="nav-list">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
