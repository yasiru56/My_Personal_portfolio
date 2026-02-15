import React from "react";
import data from "../../data/index.json";

export default function Testimonials() {
  const renderStars = (count) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <svg key={i} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={i < count ? "#fbbf24" : "#e5e7eb"} className="star-icon">
          <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" />
        </svg>
      );
    }
    return stars;
  };

  return (
    <section id="testimonial" className="testimonial--section">
      <div className="portfolio--container-box">
        <div className="portfolio--container">
          <p className="sub--title">Clients Feedback</p>
          <h2 className="section--heading">Testimonials</h2>
        </div>
      </div>
      <div className="testimonial--section--container">
        {data?.testimonial?.map((item, index) => (
          <div key={index} className="testimonial--section--card fade-in-up" style={{ animationDelay: `${index * 0.2}s` }}>
            <div className="testimonial--rating">
              {renderStars(parseInt(item.count || 5))}
            </div>
            <p className="testimonial--section--description">"{item.description}"</p>
            <div className="testimonial--section--author">
              <div className="testimonial--author--img">
                <img src={item.src} alt={item.author_name} onError={(e) => e.target.src = "/img/avatar-image.png"} />
              </div>
              <div className="testimonial--author--details">
                <h3 className="testimonial--author--name">{item.author_name}</h3>
                <p className="testimonial--author--designation">
                  {item.author_designation}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
