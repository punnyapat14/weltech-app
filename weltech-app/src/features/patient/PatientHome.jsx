import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient'; 
import { 
    ArrowLeft, Calendar, Clock, Stethoscope, MapPin, Sun, Moon, 
    CloudSun, CloudMoon, Cloud, CloudRain, CloudLightning, Snowflake, 
    CloudFog, Droplets, Wind 
} from 'lucide-react';
import ProfileView from '../profile/ProfileView'; 
import { formatThaiDateFull } from '../../utils/helpers'; 

const PatientHome = ({ theme, userProfile, appointments }) => { 
    const [viewingDoctor, setViewingDoctor] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // --- ส่วนที่ดึงมาจาก DoctorDashboard ---
    const [coords, setCoords] = useState({ lat: 13.75, lon: 100.50 });
    const [weatherData, setWeatherData] = useState({ 
        temp: '--', 
        humidity: '--', 
        aqi: 0, 
        status: 'กำลังโหลด...',
        weatherMain: '', 
        locationName: 'กำลังระบุตำแหน่ง...',
        feelsLike: '--',
        tempMin: '--',
        tempMax: '--'
    });

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCoords({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                (error) => console.error("Geolocation Error:", error),
                { enableHighAccuracy: true }
            );
        }
    }, []);

    const fetchWeatherAndAQI = async () => {
        const API_KEY = 'f251dad87ca5a894fd860d4a6b06e61e';
        try {
            const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${API_KEY}&lang=th`);
            const weatherJson = await weatherRes.json();
            const airRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}`);
            const airJson = await airRes.json();

            setWeatherData({
                temp: Math.round(weatherJson.main.temp),
                humidity: weatherJson.main.humidity,
                aqi: airJson.list[0].main.aqi, 
                status: weatherJson.weather[0].description,
                weatherMain: weatherJson.weather[0].main,
                locationName: weatherJson.name, 
                feelsLike: Math.round(weatherJson.main.feels_like),
                tempMin: Math.round(weatherJson.main.temp_min),
                tempMax: Math.round(weatherJson.main.temp_max)
            });
        } catch (error) { console.error("Weather Error:", error); }
    };

    useEffect(() => {
        fetchWeatherAndAQI();
        const weatherInterval = setInterval(fetchWeatherAndAQI, 600000);
        const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => { clearInterval(weatherInterval); clearInterval(timeInterval); };
    }, [coords]); 

    const timeScene = useMemo(() => {
        const hour = currentTime.getHours();
        if (hour >= 5 && hour < 7) return { label: 'รุ่งเช้า', class: 'from-orange-400 to-blue-500', isNight: false };
        if (hour >= 7 && hour < 17) return { label: 'กลางวัน', class: 'from-blue-400 to-blue-600', isNight: false };
        if (hour >= 17 && hour < 19) return { label: 'เย็น', class: 'from-orange-500 to-purple-800', isNight: false };
        return { label: 'ค่ำ', class: 'from-slate-900 via-blue-900 to-slate-800', isNight: true };
    }, [currentTime]);

    const getWeatherIcon = (main) => {
        const iconSize = 44;
        const iconClass = "transition-all duration-500 drop-shadow-md"; 
        const isNight = timeScene.isNight;

        switch (main) {
            case 'Clear':
                return isNight 
                    ? <Moon size={iconSize} className={`${iconClass} text-yellow-100`} /> 
                    : <Sun size={iconSize} className={`${iconClass} text-yellow-300`} />;
            case 'Clouds':
                return isNight 
                    ? <CloudMoon size={iconSize} className={`${iconClass} text-slate-300`} /> 
                    : <CloudSun size={iconSize} className={`${iconClass} text-blue-100`} />;
            case 'Rain':
            case 'Drizzle':
                return <CloudRain size={iconSize} className={`${iconClass} text-blue-300`} />;
            case 'Thunderstorm':
                return <CloudLightning size={iconSize} className={`${iconClass} text-yellow-400`} />;
            case 'Snow':
                return <Snowflake size={iconSize} className={`${iconClass} text-white`} />;
            case 'Atmosphere':
                return <CloudFog size={iconSize} className={`${iconClass} text-gray-300`} />;
            default:
                return <Cloud size={iconSize} className={`${iconClass} text-gray-200`} />;
        }
    };

    const getAQIInfo = (aqi) => {
        const map = {
            1: { label: 'ดีมาก', color: 'text-green-500', bg: 'bg-green-100', pos: '10%' },
            2: { label: 'ปานกลาง', color: 'text-yellow-500', bg: 'bg-yellow-100', pos: '35%' },
            3: { label: 'เริ่มแย่', color: 'text-orange-500', bg: 'bg-orange-100', pos: '60%' },
            4: { label: 'แย่', color: 'text-red-500', bg: 'bg-red-100', pos: '80%' },
            5: { label: 'อันตราย', color: 'text-purple-600', bg: 'bg-purple-100', pos: '95%' },
        };
        return map[aqi] || { label: 'กำลังโหลด...', color: 'text-gray-400', bg: 'bg-gray-100', pos: '0%' };
    };
    // --- จบส่วนที่ดึงมาจาก DoctorDashboard ---

    const handleViewDoctor = async () => {
        const docId = userProfile?.doctor_id;
        if (!docId) return alert("คุณยังไม่มีแพทย์เจ้าของไข้");

        try {
            const { data: docProfile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', docId)
                .maybeSingle();

            if (error) throw error;
            setViewingDoctor(docProfile);
        } catch (e) {
            console.error("Fetch doctor error:", e.message);
            alert("ไม่สามารถดึงข้อมูลแพทย์ได้: " + e.message);
        }
    };

    const getCardColorClass = (status) => {
        if (!status) return 'bg-gray-100 border-gray-200 text-gray-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white';
        if (status.includes('รอตรวจ') || status === 'waiting_exam') {
            return 'bg-red-500 shadow-lg border-red-400 text-white';
        }
        if (status.includes('รอผล') || status.includes('ฟังผล') || status === 'waiting_result') {
            return 'bg-amber-500 shadow-lg border-amber-400 text-white';
        }
        if (status.includes('เสร็จ') || status === 'completed') {
            return 'bg-emerald-500 shadow-lg border-emerald-400 text-white';
        }
        return 'bg-gray-100 border-gray-200 text-gray-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white';
    };

    if (viewingDoctor) {
        return (
            <div className="space-y-4 animate-fade-in">
                <button onClick={() => setViewingDoctor(null)} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-teal-600 transition-colors">
                    <ArrowLeft size={18}/> กลับไปหน้าหลัก
                </button>
                <div className={`p-6 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    <h3 className={`font-bold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>ข้อมูลแพทย์เจ้าของไข้</h3>
                    <ProfileView data={viewingDoctor} theme={theme} hideAddress={true} />
                </div>
            </div>
        );
    }

    const myAppts = appointments?.filter(a => a.patient_id === userProfile?.id || a.patient_id === userProfile?.user_id) || [];

    return (
        <div className="space-y-6">
            {/* --- ส่วนแสดงผลสภาพอากาศ (Weather Sections) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 shrink-0">
                {/* ช่อง 1: อุณหภูมิ + เวลาเรียลไทม์ */}
                <div className={`relative overflow-hidden p-5 md:p-6 rounded-[1.8rem] md:rounded-[2rem] shadow-lg flex flex-col justify-between min-h-[11rem] md:h-52 text-white bg-gradient-to-br transition-all duration-1000 ${timeScene.class}`}>
                    <div className="absolute inset-0 opacity-15 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                    <div className="z-10 flex justify-between items-start">
                        <div className="flex items-center gap-1.5 text-xs font-medium bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                            <MapPin size={13} className="animate-bounce" /> <span className="truncate max-w-[120px]">{weatherData.locationName}</span>
                        </div>
                        <div className="drop-shadow-lg">
                            {getWeatherIcon(weatherData.weatherMain)}
                        </div>
                    </div>
                    <div className="z-10 flex flex-col items-start gap-0.5">
                        <div className="flex items-start">
                            <h2 className="text-4xl md:text-5xl font-bold leading-none tracking-tighter">{weatherData.temp}</h2>
                            <span className="text-xl font-light mt-0.5">°C</span>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-lg md:text-xl font-bold tracking-tight font-mono opacity-95">
                                {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </h2>
                            <span className="text-[8px] opacity-60 tracking-[0.12em]">REAL-TIME CLOCK</span>
                        </div>
                    </div>
                    <div className="z-10 flex justify-between items-center text-[10px] font-medium opacity-80 border-t border-white/10 pt-2 mt-1">
                        <span className="uppercase tracking-wider">อุณหภูมิปัจจุบัน</span>
                    </div>
                </div>

                {/* ช่อง 2: ความชื้น */}
                <div className={`p-5 md:p-6 rounded-[1.8rem] md:rounded-[2rem] border shadow-sm flex flex-col justify-between min-h-[11rem] md:h-52 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-2 text-blue-500">
                        <Droplets size={18} />
                        <span className="font-bold text-sm md:text-base">ความชื้น</span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                        <h3 className={`text-4xl md:text-5xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>
                            {weatherData.humidity}<span className="text-xl font-light ml-0.5">%</span>
                        </h3>
                        <div className="w-full bg-gray-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden p-0.5 shadow-inner">
                            <div className="h-full bg-gradient-to-r from-cyan-300 to-blue-500 rounded-full transition-all duration-1000" style={{ width: `${weatherData.humidity}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* ช่อง 3: AQI */}
                <div className={`p-5 md:p-6 rounded-[1.8rem] md:rounded-[2rem] border shadow-sm flex flex-col justify-between min-h-[11rem] md:h-52 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-2 text-blue-500">
                        <Wind size={18} />
                        <span className="font-bold text-sm md:text-base">ดัชนี AQI</span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-baseline justify-between">
                            <h3 className={`text-4xl md:text-5xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>{weatherData.aqi}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] ${getAQIInfo(weatherData.aqi)?.bg} ${getAQIInfo(weatherData.aqi)?.color}`}>
                                {getAQIInfo(weatherData.aqi)?.label}
                            </span>
                        </div>
                        <div className="relative pt-2.5">
                            <div className="w-full h-2 rounded-full bg-gradient-to-r from-green-500 via-yellow-400 via-orange-500 via-red-500 to-purple-700 shadow-inner"></div>
                            <div className="absolute top-1.5 w-4 h-4 bg-white border-[2.5px] border-slate-800 rounded-full shadow-md transition-all duration-1000" style={{ left: `calc(${getAQIInfo(weatherData.aqi)?.pos || '0%'} - 8px)` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`rounded-3xl p-6 shadow-sm border transition-colors duration-300
                ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-100 text-gray-800'}`}>
                
                <div className="relative z-10">
                    <h2 className={`font-bold text-xl mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        <Calendar className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}/> นัดหมายที่จะมาถึง
                    </h2>
                    
                    {myAppts.length > 0 ? (
                        myAppts.map(appt => (
                            <div key={appt.id} className={`rounded-2xl p-4 border flex flex-col md:flex-row justify-between items-center gap-4 mb-3 transition-all ${getCardColorClass(appt.status)}`}>
                                <div className="flex-1 w-full">
                                    <div className="flex items-center gap-2 text-sm opacity-90 mb-1">
                                        <Clock size={16}/> {formatThaiDateFull(appt.date)} เวลา {appt.time} น.
                                    </div>
                                    <div className="text-2xl font-bold mb-2">{appt.title}</div>
                                    <div 
                                        className="flex items-center gap-2 cursor-pointer hover:underline hover:opacity-80 transition-opacity w-fit bg-black/10 px-3 py-1 rounded-full"
                                        onClick={handleViewDoctor}
                                        title="คลิกเพื่อดูประวัติแพทย์"
                                    >
                                        <Stethoscope size={16}/> แพทย์ {appt.doctor_name || 'ไม่ระบุ'}
                                    </div>
                                </div>
                                <div className="text-xs font-bold bg-white/20 px-3 py-1 rounded-lg uppercase tracking-wider">
                                    {appt.status}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <p>ไม่มีนัดหมายเร็วๆ นี้</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientHome;