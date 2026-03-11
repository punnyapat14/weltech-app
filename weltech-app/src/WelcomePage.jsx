import React from 'react';
import { ArrowRight, User, Stethoscope, Shield } from 'lucide-react';

import logoImg from './assets/logo.png';
import kmutnbLogo from './assets/kmutnb.png';

const WelcomePage = ({ onEnter }) => {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f172a] text-white font-sans selection:bg-teal-500 selection:text-white flex flex-col justify-between">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Prompt', sans-serif !important; }
        
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        
        @keyframes shimmer {
            100% { transform: translateX(100%); }
        }
      `}</style>
      
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[120px] animate-blob pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[450px] h-[450px] bg-blue-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-blob animation-delay-4000 pointer-events-none"></div>

      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center justify-center flex-grow px-4 text-center mt-10">
        
        <div className="mb-8 relative group cursor-default">

            <div className="absolute -inset-4 bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            
            <div className="relative w-40 h-40 bg-slate-900/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-slate-700/50 shadow-2xl p-4">
                <img 
                    src={logoImg} 
                    alt="WelTech Logo" 
                    className="w-full h-full object-contain drop-shadow-lg"
                />
            </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-200 via-blue-200 to-purple-200 drop-shadow-sm">
          WelTech
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 font-light leading-relaxed">
          เว็บไซต์บริหารจัดการโรงพยาบาลอัจฉริยะ <br className="hidden md:block"/>
        
        </p>

        <button 
            onClick={onEnter}
            className="group relative px-8 py-4 bg-slate-100 text-slate-900 rounded-full font-bold text-lg shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
        >
            <span className="relative z-10">เข้าสู่เว็บไซต์</span>
            <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        </button>

        <div className="mt-12 flex flex-wrap justify-center gap-4 md:gap-6 opacity-60">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-[10px] md:text-xs font-medium">
                <User size={12} /> ผู้ป่วย
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-[10px] md:text-xs font-medium">
                <Stethoscope size={12} /> แพทย์
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[10px] md:text-xs font-medium">
                <Shield size={12} /> แอดมิน
            </div>
        </div>
      </div>

      <div className="relative z-10 w-full py-6 flex flex-col items-center justify-center">
          <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest">Supported by</p>
          <img 
            src={kmutnbLogo} 
            alt="KMUTNB Logo" 
            className="h-12 md:h-16 object-contain drop-shadow-xl"
          />
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        
        @keyframes shimmer {
            100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;