import AboutMe from "../AboutMe";
import ContactMe from "../ContactMe";
import Footer from "../Footer";
import HeroSection from "../HeroSection";
import MyPortfolio from "../MyPortfolio";
import MySkills from "../MySkills";
import ParallaxGallery from "../../ParallaxGallery/ParallaxGallery";

export default function Home() {
    return (
        <>
            <ParallaxGallery />
            <HeroSection />
            <MySkills />
            <AboutMe />
            <MyPortfolio></MyPortfolio>
            <ContactMe />
            <Footer />
            
        </>
    );
} 