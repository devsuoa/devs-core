import { useEffect } from "react";

export default function QRCode() {
    useEffect(() => {
        window.location.href = "https://www.devsuoa.com/join";
    }, []);

    return (
        <div className="flex items-center justify-center h-screen font-pixelify">
            <h1 className="text-2xl">Loading...</h1>
        </div>
    );
} 
