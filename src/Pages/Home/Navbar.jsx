
import { useState, useEffect } from "react";
import { Link } from "react-scroll";

function Navbar() {
  const [navActive, setNavActive] = useState(false);

  const toggleNav = () => {
    setNavActive(!navActive);
  };

  const closeMenu = () => {
    setNavActive(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 500) {
        closeMenu(); // Fixed function call
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <nav className={`navbar ${navActive ? "active" : ""}`}>
      <div className="navbar--logo">
        <img src="./img/logo.svg" alt="Logoipsum" />
      </div>

      <div className="nav__hamburger" onClick={toggleNav}>
        <span className="nav__hamburger__line"></span>
        <span className="nav__hamburger__line"></span>
        <span className="nav__hamburger__line"></span>
      </div>

      <div className={`navbar--items ${navActive ? "active" : ""}`}>
        <ul>
          <li>
            <Link onClick={closeMenu} to="heroSection" spy={true} smooth={true} offset={-70} duration={500} className="navbar--content">
              Home
            </Link>
          </li>
          <li>
            <Link onClick={closeMenu} to="MyPortfolio" spy={true} smooth={true} offset={-70} duration={500} className="navbar--content">
              Portfolio
            </Link>
          </li>
          <li>
            <Link onClick={closeMenu} to="AboutMe" spy={true} smooth={true} offset={-70} duration={500} className="navbar--content">
              About Me
            </Link>
          </li>
          <li>
            <Link onClick={closeMenu} to="testimonial" spy={true} smooth={true} offset={-70} duration={500} className="navbar--content">
              Testimonials
            </Link>
          </li>
        </ul>
      </div>

      <Link onClick={closeMenu} to="Contact" spy={true} smooth={true} offset={-70} duration={500} className="btn btn-outline-primary">
        Contact Me
      </Link>
    </nav>
  );
}

export default Navbar;
