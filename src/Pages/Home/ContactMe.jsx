import { useState } from "react";

export default function ContactMe() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    topic: "",
    message: "",
    acceptedTerms: false,
  });

  const [status, setStatus] = useState("idle"); // idle, submitting, success

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("submitting");
    // Simulate API call
    setTimeout(() => {
      setStatus("success");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        topic: "",
        message: "",
        acceptedTerms: false,
      });
      // Reset status after a few seconds
      setTimeout(() => setStatus("idle"), 3000);
    }, 1500);
  };

  return (
    <section id="Contact" className="contact--section">
      <div className="contact--header">
        <p className="sub--title">Get In Touch</p>
        <h2 className="section--heading">Contact Me</h2>
        <p className="text-lg contact--desc">
          Have a project in mind or just want to say hi? I'd love to hear from you.
        </p>
      </div>

      {status === "success" ? (
        <div className="contact--success fade-in-up">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h3>Message Sent!</h3>
          <p>Thanks for reaching out. I'll get back to you soon.</p>
        </div>
      ) : (
        <form className="contact--form--container fade-in-up" onSubmit={handleSubmit}>
          <div className="contact--grid">
            <div className="input-group">
              <input
                type="text"
                className="contact--input"
                name="firstName"
                id="first-name"
                placeholder=" "
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <label htmlFor="first-name" className="contact--label-floating">First Name</label>
            </div>

            <div className="input-group">
              <input
                type="text"
                className="contact--input"
                name="lastName"
                id="last-name"
                placeholder=" "
                value={formData.lastName}
                onChange={handleChange}
                required
              />
              <label htmlFor="last-name" className="contact--label-floating">Last Name</label>
            </div>

            <div className="input-group">
              <input
                type="email"
                className="contact--input"
                name="email"
                id="email"
                placeholder=" "
                value={formData.email}
                onChange={handleChange}
                required
              />
              <label htmlFor="email" className="contact--label-floating">Email</label>
            </div>

            <div className="input-group">
              <input
                type="tel"
                className="contact--input"
                name="phoneNumber"
                id="phone-number"
                placeholder=" "
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
              <label htmlFor="phone-number" className="contact--label-floating">Phone Number</label>
            </div>
          </div>

          <div className="input-group">
            <select
              id="choose-topic"
              name="topic"
              className="contact--input"
              value={formData.topic}
              onChange={handleChange}
              required
            >
              <option value="" disabled hidden></option>
              <option value="freelance">Freelance Project</option>
              <option value="job">Job Opportunity</option>
              <option value="collaboration">Collaboration</option>
              <option value="other">Other</option>
            </select>
            <label htmlFor="choose-topic" className="contact--label-floating select-label">Subject</label>
          </div>

          <div className="input-group">
            <textarea
              className="contact--input"
              name="message"
              id="message"
              rows="6"
              placeholder=" "
              value={formData.message}
              onChange={handleChange}
              required
            />
            <label htmlFor="message" className="contact--label-floating">Message</label>
          </div>

          <label htmlFor="checkbox" className="checkbox--label">
            <input
              type="checkbox"
              required
              name="acceptedTerms"
              id="checkbox"
              checked={formData.acceptedTerms}
              onChange={handleChange}
            />
            <span className="text-sm">I accept the terms and privacy policy</span>
          </label>

          <div>
            <button
              type="submit"
              className={`btn btn-primary contact--form--btn ${status === "submitting" ? "loading" : ""}`}
              disabled={status === "submitting"}
            >
              {status === "submitting" ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}