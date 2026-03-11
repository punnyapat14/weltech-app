import React from 'react';

const GlobalStyles = () => {
  React.useEffect(() => {
    const fontStyle = document.createElement('style');
    fontStyle.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
      
      :root { --font-prompt: 'Prompt', sans-serif; }
      
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: "Prompt", sans-serif !important; text-decoration: none; list-style: none; }
      body, button, input, select, textarea { font-family: "Prompt", sans-serif !important; }

      /* --- THEME COLORS --- */
      :root {
        --theme-primary: #00897B;
        --theme-primary-hover: #00695C;
        --auth-bg-light: #F0FDFA;
        --theme-bg-dark: #0f172a;
        
        --content-bg-light: #ffffff;
        --content-bg-dark: #1e293b;

        --text-light: #334155;
        --text-dark: #f1f5f9;
        
        --input-bg-light: #ffffff;
        --input-border-light: #cbd5e1;
        --input-bg-dark: #334155;
        --input-border-dark: #475569;
        
        --toggle-bg-light: #e2e8f0;
        --toggle-bg-dark: #0f172a;
      }

      body[data-role="doctor"] {
        --theme-primary: #2563eb;
        --theme-primary-hover: #1d4ed8;
        --auth-bg-light: #EFF6FF;
      }

      body[data-role="admin"] {
        --theme-primary: #6b21a8;
        --theme-primary-hover: #581c87;
        --auth-bg-light: #FAF5FF;
      }

      body {
        margin: 0; padding: 0; height: 100vh; width: 100vw;
        overflow-x: hidden;
        background: var(--content-bg-light);
        transition: background-color 0.3s ease, color 0.3s ease;
      }
      body.dark { background: var(--theme-bg-dark); }

      input::-ms-reveal, input::-ms-clear { display: none; }

      input, select, textarea {
          color: var(--text-light) !important;
          background-color: var(--input-bg-light) !important;
          border: 1px solid var(--input-border-light) !important;
          transition: all 0.3s ease;
      }
      body.dark input, body.dark select, body.dark textarea {
          color: var(--text-dark) !important;
          background-color: var(--input-bg-dark) !important;
          border: 1px solid var(--input-border-dark) !important;
      }

      /* Custom Scrollbar */
      .custom-dropdown-scroll::-webkit-scrollbar { width: 6px; }
      .custom-dropdown-scroll::-webkit-scrollbar-track { background: transparent; }
      .custom-dropdown-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      .custom-dropdown-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

      /* Wrapper & Containers (Login) */
      .auth-wrapper {
        display: flex; justify-content: center; align-items: center; min-height: 100vh;
        background: var(--auth-bg-light); transition: background 0.3s ease;
        padding: 20px;
      }
      .auth-wrapper.dark { background: var(--theme-bg-dark); }

      .container {
      position: relative;
      width: 100% !important; 
      max-width: 900px;       
      height: 720px;          
      min-height: 600px;      
      
      background: var(--content-bg-light); border-radius: 30px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1); overflow: hidden;
      transition: background-color 0.3s ease;
      
      margin: 20px; 
    }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px); 
  }
  to {
    opacity: 1;
    transform: translateY(0); 
  }
}

.animate-fade-in {
  animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  will-change: transform, opacity; 


.content-transition {
  transition: background-color 0.3s ease, color 0.3s ease;
}

    @media (max-width: 768px) {
      .container {
        height: auto !important; 
        min-height: 800px;
        flex-direction: column;
      }
      
      .form-box {
        width: 100% !important;
        height: auto !important;
        position: relative !important;
        right: 0 !important;
        top: 0 !important;
        padding: 30px 20px;
      }
      
      .toggle-box {
        display: none !important; 
      }
      
      .form-box.register {
        display: none; 
      }
      
      .container.active .form-box.login {
        display: none; 
      }
      .container.active .form-box.register {
        display: flex; 
        position: relative;
        opacity: 1;
        visibility: visible;
        transform: none;
      }
    }
      .container.dark { background: var(--content-bg-dark); color: var(--text-dark); }

      /* Login/Register Form Logic */
      .form-box {
        position: absolute; right: 0; width: 50%; height: 100%;
        background: var(--content-bg-light); display: flex; flex-direction: column;
        justify-content: center; align-items: center; color: var(--text-light);
        text-align: center; padding: 40px; z-index: 1;
        transition: all 0.6s ease-in-out, background-color 0.3s ease; 
      }
      .container.dark .form-box { background: var(--content-bg-dark); color: var(--text-dark); }
      .container.active .form-box { right: 50%; }

      .form-box.login { opacity: 1; visibility: visible; pointer-events: auto; z-index: 2; }
      .container.active .form-box.login { opacity: 0; visibility: hidden; pointer-events: none; transform: translateX(-20%); }

      .form-box.register { opacity: 0; visibility: hidden; pointer-events: none; z-index: 1; }
      .container.active .form-box.register { opacity: 1; visibility: visible; pointer-events: auto; z-index: 5; }

      .container h1 { font-size: 32px; margin-bottom: 5px; font-weight: 700; }
      .container p { font-size: 14px; margin-bottom: 15px; }

      /* INPUT STYLES */
      .input-box { position: relative; margin: 8px 0; width: 100%; }
      .input-box input {
        width: 100%; padding: 10px 40px 10px 15px;
        border-radius: 10px; 
        outline: none; font-size: 13px; font-weight: 400;
      }
      .input-box input:focus { border-color: var(--theme-primary); box-shadow: 0 0 0 3px rgba(0,0,0,0.05); }
          
      .input-box.has-icon input { padding-left: 40px; }

      /* SELECT & SEARCHABLE INPUT */
      .select-wrapper { position: relative; width: 100%; margin: 8px 0; }
      .select-wrapper select, .select-wrapper input {
        width: 100%; padding: 10px 12px;
        border-radius: 10px;
        outline: none; font-size: 13px;
        cursor: pointer;
      }
      .select-wrapper select:focus, .select-wrapper input:focus { border-color: var(--theme-primary); box-shadow: 0 0 0 3px rgba(0,0,0,0.05); }
        
      .select-arrow { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #94a3b8; }

      .label-text { font-size: 12px; font-weight: 600; margin-bottom: 4px; display: block; text-align: left; opacity: 0.9; color: var(--text-light); }
      .container.dark .label-text { color: #cbd5e1; }
      .required-star { color: #ef4444; margin-left: 2px; }

      .btn {
        width: 100%; height: 48px; background: var(--theme-primary);
        border-radius: 12px; border: none; cursor: pointer;
        font-size: 15px; color: #fff; font-weight: 600; margin-top: 15px;
        transition: all 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .btn:hover { background: var(--theme-primary-hover); transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0,0,0,0.15); }

    
      .toggle-box { position: absolute; width: 100%; height: 100%; pointer-events: none; }
      .toggle-box::before {
        content: ''; position: absolute; left: -250%; width: 300%; height: 100%;
        background: var(--theme-primary); border-radius: 150px; z-index: 10;
        transition: left 1.8s ease-in-out, background-color 0.3s;
      }
      .container.active .toggle-box::before { left: 50%; }

      .toggle-panel {
        position: absolute; width: 50%; height: 100%; color: #fff;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        z-index: 11; transition: left 0.6s ease-in-out, right 0.6s ease-in-out; pointer-events: auto;
      }
      .toggle-panel.toggle-left { left: 0; transition-delay: 1.2s; }
      .container.active .toggle-panel.toggle-left { left: -50%; transition-delay: .6s; }
      .toggle-panel.toggle-right { right: -50%; transition-delay: .6s; }
      .container.active .toggle-panel.toggle-right { right: 0; transition-delay: 1.2s; }
          
      .toggle-panel .btn { width: 140px; height: 40px; background: transparent; border: 2px solid #fff; box-shadow: none; margin-top: 5px; }
      .toggle-panel .btn:hover { background: rgba(255,255,255,0.2); transform: none; }

    
      .theme-switch {
        position: fixed; bottom: 25px; right: 25px; width: 80px; height: 40px; 
        border-radius: 40px; background: var(--toggle-bg-light); border: 2px solid #cbd5e1;
        cursor: pointer; display: flex; align-items: center; justify-content: space-between;
        padding: 0 6px; z-index: 100; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      }
      .theme-switch.dark { background: var(--toggle-bg-dark); border-color: #475569; }
          
      .theme-knob {
        position: absolute; width: 30px; height: 30px; background: white; border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        display: flex; align-items: center; justify-content: center;
      }
      .theme-switch.light .theme-knob { transform: translateX(0); background: #fb923c; }
      .theme-switch.dark .theme-knob { transform: translateX(38px); background: #6366f1; }

      
      .custom-scroll::-webkit-scrollbar { width: 5px; }
      .custom-scroll::-webkit-scrollbar-track { background: transparent; }
      .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

      .profile-upload { position: relative; width: 90px; height: 90px; margin: 0 auto 15px; cursor: pointer; transition: transform 0.2s; }
      .profile-upload:hover { transform: scale(1.05); }
      .profile-upload img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; border: 3px solid var(--theme-primary); background: #f1f5f9; }
      .profile-upload .upload-icon {
        position: absolute; bottom: 0; right: 0; background: var(--theme-primary);
        color: white; border-radius: 50%; padding: 6px; border: 2px solid white;
      }

      .bmi-box { font-size: 11px; padding: 10px; border-radius: 10px; text-align: center; margin-top: 8px; font-weight: 700; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }

      /* Animation */
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
    `;
    document.head.appendChild(fontStyle);
    return () => {
    };
  }, []);

  return null; 
};

export default GlobalStyles;