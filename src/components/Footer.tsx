// GIVEN FILE (styled in nav.css by Member 2). Do not edit.
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid container">
        <div className="footer-col">
          <h2 className="footer-title">CampusConnect</h2>
          <p>A student events portal built as a CCC181 class activity.</p>
        </div>
        <div className="footer-col">
          <h2 className="footer-title">Quick links</h2>
          <ul className="footer-links">
            <li>
              <a href="#events">Upcoming events</a>
            </li>
            <li>
              <a href="#help">Help center</a>
            </li>
            <li>
              <a href="#privacy">Privacy notice</a>
            </li>
          </ul>
        </div>
        <div className="footer-col">
          <h2 className="footer-title">Contact</h2>
          <p>MSU-Naawan, Naawan, Misamis Oriental</p>
          <p>events@campusconnect.example</p>
        </div>
      </div>
      <p className="footer-copy container">
        &copy; 2026 CampusConnect. Class activity only.
      </p>
    </footer>
  );
}
