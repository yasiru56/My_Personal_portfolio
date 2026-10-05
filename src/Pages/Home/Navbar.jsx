
import { useState, useEffect } from "react";
import { Link } from "react-scroll";

function Navbar() {
  const [navActive, setNavActive] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const toggleNav = () => {
    setNavActive(!navActive);
  };

  const closeMenu = () => {
    setNavActive(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1200) {
        closeMenu();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <nav className={`navbar ${navActive ? "active" : ""} ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar--logo">
        {/* Ensure you have a logo that works on dark background, or text logo */}
        <h2 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Yasiru.</h2>
      </div>

      <a className={`nav__hamburger ${navActive ? "active" : ""}`} onClick={toggleNav} role="button" aria-expanded={navActive} aria-label="Toggle navigation">
        <span className="line"></span>
        <span className="line"></span>
        <span className="line"></span>
      </a>

      <div className={`navbar--items ${navActive ? "active" : ""}`}>
        <ul>
          <li>
            <Link onClick={closeMenu} activeClass="active" to="home" spy={true} smooth={true} offset={-70} duration={500} className="nav-link">
              Home
            </Link>
          </li>
          <li>
            <Link onClick={closeMenu} activeClass="active" to="MyPortfolio" spy={true} smooth={true} offset={-70} duration={500} className="nav-link">
              Portfolio
            </Link>
          </li>
          <li>
            <Link onClick={closeMenu} activeClass="active" to="AboutMe" spy={true} smooth={true} offset={-70} duration={500} className="nav-link">
              About Me
            </Link>
          </li>
        </ul>
      </div>

      <Link onClick={closeMenu} to="Contact" spy={true} smooth={true} offset={-70} duration={500} className="btn-primary">
        Contact Me
      </Link>
    </nav>
  );
}

export default Navbar;
