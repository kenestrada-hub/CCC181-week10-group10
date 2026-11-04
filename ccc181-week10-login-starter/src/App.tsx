// GIVEN FILE: your job is the CSS in src/styles/. Do not edit .tsx files
// (if you must, tell your group first). Class names are fixed; style them.
import Navbar from './components/Navbar';
import BrandPanel from './components/BrandPanel';
import LoginForm from './components/LoginForm';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <div className="login-layout">
          <BrandPanel />
          <LoginForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
