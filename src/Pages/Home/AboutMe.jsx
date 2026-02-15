export default function AboutMe() {
  return (
    <section id="AboutMe" className="about--section">
      <div className="about--section--img-container fade-in-up">
        <div className="about--glow"></div>
        <img src="./img/about-me1.jpg" alt="About Me" className="about--img" />
        <div className="about--glass-overlay"></div>
      </div>

      <div className="about--section--content fade-in-up delay-2">
        <p className="sub--title">Who I Am</p>
        <h2 className="section--heading">About Me</h2>
        <p className="about--description">
          I am a <strong>Full-Stack Engineer</strong> dedicated to building scalable, high-performance web applications.
          Bridging the gap between complex backend logic and intuitive frontend design, I create
          digital experiences that are both robust and visually stunning.
        </p>
        <p className="about--description">
          With deep expertise in the <strong>React ecosystem, Node.js, and Cloud Infrastructure</strong>,
          I focus on delivering clean, maintainable code. My approach combines technical precision with
          creative problem-solving to drive innovation in every project.
        </p>

        <div className="about--stats">
          <div className="stat-item">
            <span className="stat-number">3+</span>
            <span className="stat-label">Years Exp.</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">15+</span>
            <span className="stat-label">Projects</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">Commitment</span>
          </div>
        </div>
      </div>
    </section>
  );
}
