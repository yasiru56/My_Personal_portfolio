import React from "react";
import data from "../../data/index.json";

export default function Testimonials() {
  return (
    <section id="testimonial" className="testimonial--section">
      <div className="portfolio--container">
        <p className="section--title">Testimonials</p>
        <h2 className="skills--section--heading">What Clients Say</h2>
      </div>
      <div className="testimonial--section--container">
        {data?.testimonial?.map((item, index) => (
          <div key={index} className="testimonial--section--card">
            <div className="testimonial--section--img">
              <img src={item.src} alt={item.author_name} />
            </div>
            <p className="testimonial--section--description">{item.description}</p>
            <div className="testimonial--section--author">
              <h3 className="testimonial--author--name">{item.author_name}</h3>
              <p className="testimonial--author--designation">
                {item.author_designation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
