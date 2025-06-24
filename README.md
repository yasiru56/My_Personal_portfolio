# Personal Portfolio

This repository contains the source code for my personal portfolio website built with **React**.
The application showcases my projects, skills, and provides a way to contact me.

## Features

- **Hero section** with an introduction and call to action.
- **Smooth scrolling navigation** powered by `react-scroll`.
- **Skills** and **About Me** sections to highlight experience.
- **Portfolio** section with external GitHub links for recent work.
- **Contact form** for visitors to reach out.
- **Responsive design** that works across devices.

## Tech Stack

- [React](https://reactjs.org/) and [react-scripts](https://www.npmjs.com/package/react-scripts)
- [react-router-dom](https://www.npmjs.com/package/react-router-dom) for routing
- [react-scroll](https://www.npmjs.com/package/react-scroll) for smooth scrolling

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```
   The app will open at [http://localhost:3000](http://localhost:3000).

## Building for Production

Generate an optimized build with:
```bash
npm run build
```
The output appears in the `build` directory.

## Deployment

Any static hosting provider can serve the contents of the `build` folder.
For example, you can deploy to **Netlify**, **Vercel**, or GitHub Pages:

```bash
npm install -g serve
serve -s build
```

This will run a local production server so you can verify the build before deploying.

