export default function HeroSection() {
    return (
      <section id="heroSection" className="hero--section">
        <div className="hero--section--content--box">
          <div className="hero--section--content">
            <p className="section--title">Hey, I'm <span className="highlight">Yasiru Induwara</span></p>
            <h1 className="hero--section--title">
              <span className="hero--section-title--color">Full Stack</span>
              <br />
              Developer
            </h1>
            <p className="hero--section-description">
              I create stunning, high-performance web applications. 
              <br /> Passionate about UI/UX, Backend Systems, and Cloud Technologies.
            </p>
            <button className="btn btn-primary">Get In Touch</button>
          </div>
        </div>
        <div className="hero--section--img">
          <img src="./img/hero_img2.jpg" alt="Hero Section" />
        </div>
      </section>
    );
  }
  