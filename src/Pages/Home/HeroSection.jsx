export default function HeroSection() {
  return (
    <section id="heroSection" className="hero--section">
      <div className="hero--section--content--box">
        <div className="hero--section--content">
          <p className="section--title fade-in-up delay-1">Full Stack Engineer</p>
          <h1 className="hero--section--title fade-in-up delay-2">
            Crafting Scalable
            <br />
            <span className="text-gradient">Digital Experiences</span>
          </h1>
          <p className="hero--section-description fade-in-up delay-3">
            I engineer high-performance web applications with a focus on scalability,
            interactive design, and seamless user experiences. Specializing in modern React ecosystems
            and rugged backend architectures or cloud solutions.
          </p>
          <div className="hero--btn-container fade-in-up delay-4">
            <button className="btn btn-primary">Start a Project</button>
            <button className="btn btn-github">View Work</button>
          </div>
        </div>
      </div>

      <div className="hero--section--img-container fade-in delay-2">
        <div className="hero--glow"></div>
        <img src="./img/hero_img2.jpg" alt="Yasiru Induwara" className="hero--img" />

        {/* Floating Tech Badges */}
        <div className="tech-badge badge-react float-slow">
          <span className="badge-dot react-dot"></span> React
        </div>
        <div className="tech-badge badge-node float-medium">
          <span className="badge-dot node-dot"></span> Node.js
        </div>
        <div className="tech-badge badge-ai float-fast">
          <span className="badge-dot ai-dot"></span> AI & Cloud
        </div>
      </div>
    </section>
  );
}
