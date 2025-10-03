import './About.css'

function About() {
    return (
      <div className="about-container">
        <div className="about">
            <p id="about-header">NEW ZEALAND'S <span>LARGEST</span> STUDENT TECH SOCIETY</p>
            <p id="about-description">Lorem ipsum dolor sit amet, consectetur adipiscing elit, 
                sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum</p>
            <div id="join-us-container">
                <a id="about-join-us" href="#">JOIN US &gt;</a> {/* NEED TO LINK THIS TO THE GOOGLE FORM */}
            </div>
        </div>
        <div className="next-event">
            <p>NEXT EVENT:</p>
            <img src="/event.png" alt="Next Event" />
        </div>
      </div>
    )
  }

export default About
  