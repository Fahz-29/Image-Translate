import React, { useRef, useEffect, useState } from 'react';
import { CameraIcon } from './Icons';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  onBack: () => void;
}

const Camera: React.FC<CameraProps> = ({ onCapture, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Play is handled by autoPlay, but just to be sure
          await videoRef.current.play();
          setIsStreamReady(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Unable to access camera. Please allow camera permissions.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Get base64 string
        const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageSrc);
      }
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <p className="text-red-400 text-lg">{error}</p>
        <button 
          onClick={onBack}
          className="px-6 py-2 bg-slate-700 rounded-full hover:bg-slate-600 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 pb-12">
        {/* Top Bar */}
        <div className="flex justify-between items-start pointer-events-auto">
          <button 
            onClick={onBack}
            className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full">
            <span className="text-xs font-thai text-white/90">โหมดสแกนคำศัพท์</span>
          </div>
        </div>

        {/* Scan Frame (Visual Guide) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/50 rounded-2xl flex flex-col items-center justify-center pointer-events-none">
           <div className="w-60 h-60 border border-white/20 rounded-xl" />
           <p className="mt-4 text-white/70 text-sm font-thai translate-y-20 bg-black/20 px-2 rounded">เล็งวัตถุให้อยู่ในกรอบ</p>
        </div>

        {/* Bottom Bar (Shutter) */}
        <div className="flex justify-center items-center pointer-events-auto">
          <button
            onClick={handleCapture}
            disabled={!isStreamReady}
            className="group relative flex items-center justify-center"
          >
             {/* Shutter Ring */}
             <div className="w-20 h-20 rounded-full border-4 border-white transition-all group-active:scale-95" />
             {/* Shutter Button */}
             <div className="absolute w-16 h-16 bg-white rounded-full transition-all group-active:scale-90" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Camera;