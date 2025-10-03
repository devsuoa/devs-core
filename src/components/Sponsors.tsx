import './Sponsors.css'

function Sponsors() {
    return (
        <div className="sponsor-container">
            <p className="sponsors-header">Proudly Sponsored By:</p>

            <p className="sponsors-header gold">Gold Sponsors</p>
            <div className="gold-sponsors-images">
                <img src="/sponsors/gold/jane street.png" alt="Jane Street"  style={{ filter: "invert(1)" }} />
                <img src="/sponsors/gold/serato.png" alt="Serato"  style={{ filter: "invert(1)" }} />
            </div>
            
            <p className="sponsors-header silver">Silver Sponsors</p>
            <div className="silver-sponsors-images">
                <img src="/sponsors/silver/atlassian.png" alt="Atlassian" style={{ filter: "invert(1)" }} />
                <img src="/sponsors/silver/imc.png" alt="IMC"/>
                <img src="/sponsors/silver/optiver.png" alt="Optiver" style={{ filter: "invert(1) grayscale(1)" }} />
                <img src="/sponsors/silver/sandfield.png" alt="Sandfield" style={{ filter: "invert(1) grayscale(1)" }} />
                <img src="/sponsors/silver/visa.png" alt="Visa" style={{ filter: "invert(1)" }} />
            </div>
        </div>
    )
  }

export default Sponsors
  
