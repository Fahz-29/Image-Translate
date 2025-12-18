import React, { useRef, useEffect, useState } from 'react';
import { FlipCameraIcon, CameraIcon, RefreshIcon, ArrowLeftIcon } from './Icons';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  onBack: () => void;
}

const Camera: React.FC<CameraProps> = ({ onCapture, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [error, setError] = useState<{title: string, message: string, type: 'permission' | 'security' | 'other'} | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      setIsStreamReady(false);
      setError(null);

      // 1. Check for Secure Context (HTTPS)
      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        setError({
          title: "ความปลอดภัยไม่เพียงพอ",
          message: "กล้องต้องการการเชื่อมต่อแบบ HTTPS เพื่อใช้งาน กรุณาตรวจสอบ URL ของคุณ",
          type: 'security'
        });
        return;
      }

      // 2. Check for MediaDevices Support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError({
          title: "เบราว์เซอร์ไม่รองรับ",
          message: "เบราว์เซอร์นี้ไม่รองรับการเข้าถึงกล้อง กรุณาใช้ Chrome หรือ Safari เวอร์ชั่นล่าสุด",
          type: 'other'
        });
        return;
      }

      try {
        if (videoRef.current && videoRef.current.srcObject) {
           const oldStream = videoRef.current.srcObject as MediaStream;
           oldStream.getTracks().forEach(track => track.stop());
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false,
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
             await videoRef.current.play();
          } catch (e) {
             console.log("Play interrupted", e);
          }
          setIsStreamReady(true);
        }
      } catch (err: any) {
        console.error("Error accessing camera:", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError({
            title: "ไม่ได้รับอนุญาตให้ใช้กล้อง",
            message: "กรุณากด 'อนุญาต' (Allow) เพื่อให้แอปสามารถสแกนวัตถุได้ หากคุณเคยปฏิเสธไปแล้ว ให้ไปที่การตั้งค่าของเบราว์เซอร์เพื่อเปิดสิทธิ์",
            type: 'permission'
          });
        } else {
          setError({
            title: "เกิดข้อผิดพลาดของกล้อง",
            message: "ไม่สามารถเชื่อมต่อกับกล้องได้ อาจมีแอปอื่นใช้งานกล้องอยู่ หรือหากคุณเปิดจาก LINE/Facebook ให้กดปุ่ม 'เปิดด้วยเบราว์เซอร์อื่น'",
            type: 'other'
          });
        }
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, retryCount]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        if (facingMode === 'user') {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageSrc);
      }
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-slate-700">
           <CameraIcon className="w-10 h-10 text-slate-500" />
        </div>
        
        <h2 className="text-xl font-bold text-white mb-2 font-thai">{error.title}</h2>
        <p className="text-slate-400 text-sm font-thai leading-relaxed mb-8 max-w-xs">
          {error.message}
        </p>

        <div className="w-full space-y-3">
          <button 
            onClick={handleRetry}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-95 font-thai"
          >
            <RefreshIcon className="w-5 h-5" />
            <span>ลองใหม่อีกครั้ง</span>
          </button>
          
          <button 
            onClick={onBack}
            className="w-full py-4 bg-slate-800 text-slate-300 rounded-2xl font-bold border border-slate-700 transition-all font-thai"
          >
            กลับหน้าหลัก
          </button>
        </div>

        <div className="mt-10 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
           <p className="text-[10px] text-indigo-300/60 uppercase font-bold tracking-widest mb-2">💡 วิธีแก้ปัญหาเบื้องต้น</p>
           <ul className="text-[11px] text-slate-500 font-thai text-left space-y-1 list-disc pl-4">
              <li>หากเปิดใน <b>LINE</b> ให้กดเมนูมุมบนแล้วเลือก "Open in Default Browser"</li>
              <li>ตรวจสอบว่าไม่มีแอปอื่น (เช่น Zoom, Meet) กำลังใช้กล้องอยู่</li>
              <li>รีเฟรชหน้าเว็บแล้วกด <b>"Allow"</b> เมื่อมี Pop-up ถาม</li>
           </ul>
        </div>
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
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${facingMode === 'user' ? '-scale-x-100' : ''}`}
      />
      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 pb-12 z-10">
        <div className="flex justify-between items-start pointer-events-auto">
          <button 
            onClick={onBack}
            className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
            <span className="text-xs font-bold font-thai text-white/90 tracking-wide">โหมดสแกนคำศัพท์</span>
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/30 rounded-[40px] flex flex-col items-center justify-center pointer-events-none">
           <div className="absolute inset-0 border border-white/10 rounded-[38px] scale-95" />
           <div className="w-full h-full relative overflow-hidden rounded-[38px]">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-400/50 animate-scan-line" />
           </div>
           <p className="mt-4 text-white/70 text-[10px] font-bold uppercase tracking-widest absolute -bottom-12 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
             Center object in frame
           </p>
        </div>

        <div className="relative w-full flex items-center justify-center pointer-events-auto">
          <button
            onClick={handleCapture}
            disabled={!isStreamReady}
            className="group relative flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
          >
             <div className="w-20 h-20 rounded-full border-[6px] border-white/30" />
             <div className="absolute w-16 h-16 bg-white rounded-full border-4 border-black/5" />
          </button>

          <button
            onClick={toggleCamera}
            className="absolute right-4 p-4 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition active:rotate-180 duration-700 border border-white/10"
          >
             <FlipCameraIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Camera;