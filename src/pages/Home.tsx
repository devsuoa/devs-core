import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col">
      <div className="text-center my-16">
        <img src="/text_logo.png" alt="Developer's Society" className="w-[30vw] mx-auto"/>
      </div>
      <div className="flex justify-center mt-16">
        <button className="pushable">
          <span className="shadow"></span>
          <span className="edge"></span>
          <span className="front">Sponsors</span>
        </button>
        <button className="pushable">
          <span className="shadow"></span>
          <span className="edge"></span>
          <span className="front">About</span>
        </button>
        <button className="pushable">
          <span className="shadow"></span>
          <span className="edge"></span>
          <span className="front">Join</span>
        </button>
      </div>
    </div>
  );
};

export default Home;

