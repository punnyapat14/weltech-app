import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { 
    Users, Stethoscope, Calendar, ChevronLeft, ChevronRight, 
    Plus, Clock, User, Pencil, X, Wind, Droplets, Thermometer, MapPin,
    Sun, Moon, CloudSun, CloudMoon, Cloud, CloudRain, CloudLightning, Snowflake, CloudFog,
    ClipboardList, MapPinned, MessageSquare
} from 'lucide-react';

const DoctorDashboard = ({ userProfile, patientsList = [], appointments = [], fetchAppointments, theme }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    
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

    const [editingApptId, setEditingApptId] = useState(null);
    const [newAppt, setNewAppt] = useState({
        patient_id: '', 
        title: 'นัดตรวจ', 
        time: '', 
        location: '', 
        date: '',
        notes: '' 
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

    const myPatients = useMemo(() => {
        if (!userProfile || !patientsList) return [];
        return patientsList.filter(p => 
            p.doctor_id && (
                String(p.doctor_id) === String(userProfile.user_id) || 
                String(p.doctor_id) === String(userProfile.id)
            )
        );
    }, [patientsList, userProfile]);

    const myPatientsCount = myPatients.length;

    const formatDateStr = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const dailyAppointments = appointments
        .filter(appt => appt.date === formatDateStr(selectedDate))
        .sort((a, b) => a.time.localeCompare(b.time));

    const handlePrevMonth = () => setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNextMonth = () => setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

    const handleOpenEdit = (appt) => {
        setEditingApptId(appt.id); 
        setNewAppt({ 
            patient_id: appt.patient_id || '', 
            title: appt.title || 'นัดตรวจ', 
            time: appt.time || '', 
            location: appt.location || '', 
            date: appt.date || '',
            notes: appt.notes || '' 
        });
        setShowModal(true);
    };

const handleSaveAppointment = async (e) => {
 e.preventDefault();
 try {
 const creatorId = userProfile?.id;
 if (!creatorId) {
return alert("ไม่พบข้อมูลรหัสผู้ใช้ (Profile ID) ของท่าน กรุณาลอง Refresh หน้าเว็บหรือเข้าสู่ระบบใหม่");
 }

 if (!newAppt.patient_id || !newAppt.time || !newAppt.date || !newAppt.location) {
 return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
 }

 const doctorName = `${userProfile?.title_th || ''} ${userProfile?.first_name_th || ''} ${userProfile?.last_name_th || ''}`.trim();

 const apptData = { 
 patient_id: newAppt.patient_id, 
 title: newAppt.title, 
 time: newAppt.time, 
 location: newAppt.location, 
 date: newAppt.date, 
 notes: newAppt.notes || '',
 doctor_name: doctorName,
 created_by: creatorId 
 };

 if (editingApptId) { 
 const { error } = await supabase.from('appointments').update(apptData).eq('id', editingApptId); 
 if (error) throw error;
 } else { 
 const { error } = await supabase.from('appointments').insert([{ 
 ...apptData, 
 status: 'รอตรวจ'
 }]); 
 if (error) throw error;
 }
 
 setShowModal(false); 
 if (fetchAppointments) fetchAppointments(); 
 alert("ลงนัดหมายสำเร็จ!");
 } catch (error) { 
 console.error("Save error:", error);

 alert(`เกิดข้อผิดพลาดในการบันทึก: ${error.message || 'โปรดตรวจสอบความถูกต้องของข้อมูล'}`);
 }
 };


    const renderCalendarDays = () => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay(); 
        const days = [];
        for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} className="p-2"></div>);
        for (let d = 1; d <= daysInMonth; d++) {
            const current = new Date(year, month, d);
            const isSelected = d === selectedDate.getDate() && month === selectedDate.getMonth();
            const isToday = new Date().toDateString() === current.toDateString();
            const dateStr = formatDateStr(current);
            const hasAppt = appointments.some(a => a.date === dateStr);
            days.push(
                <div key={d} onClick={() => setSelectedDate(new Date(year, month, d))}
                    className={`p-2 rounded-lg cursor-pointer text-center text-sm relative transition-all ${isSelected ? 'bg-blue-600 text-white shadow-md scale-110' : (theme === 'dark' ? 'hover:bg-slate-700 text-gray-300' : 'hover:bg-blue-50 text-gray-700')} ${isToday && !isSelected ? 'border border-blue-400 font-bold text-blue-500' : ''}`}
                >
                    {d} {hasAppt && !isSelected && (<div className="w-1.5 h-1.5 bg-rose-500 rounded-full mx-auto mt-1"></div>)}
                </div>
            );
        }
        return days;
    };

    return (
        <div className="flex flex-col h-full gap-6 p-4 overflow-y-auto custom-scroll">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 shrink-0">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <div className={`p-4 rounded-2xl border flex items-center gap-4 shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Users size={24}/></div>
                    <div><p className="text-xs text-gray-400">ผู้ป่วยทั้งหมด</p><h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{patientsList.length}</h3></div>
                </div>
                <div className={`p-4 rounded-2xl border flex items-center gap-4 shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    <div className="p-3 bg-teal-100 text-teal-600 rounded-xl"><Stethoscope size={24}/></div>
                    <div><p className="text-xs text-gray-400">ในการดูแล</p><h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{myPatientsCount}</h3></div>
                </div>
                <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Calendar size={24}/></div>
                        <div><p className="text-xs text-gray-400">นัดหมายวันนี้</p><h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{dailyAppointments.length}</h3></div>
                    </div>
                    <button 
                        onClick={() => { setEditingApptId(null); setNewAppt({ patient_id: '', title: 'นัดตรวจ', time: '', location: '', date: formatDateStr(selectedDate), notes: '' }); setShowModal(true); }}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                        <Plus size={20}/>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden min-h-[400px]">
                <div className={`w-full md:w-5/12 p-6 rounded-2xl border flex flex-col shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"><ChevronLeft size={20}/></button>
                        <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{selectedDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</h3>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"><ChevronRight size={20}/></button>
                    </div>
                    <div className="grid grid-cols-7 gap-2 flex-1 content-start">{renderCalendarDays()}</div>
                </div>
                <div className={`flex-1 p-6 rounded-2xl border flex flex-col shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                    <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}><Clock size={20} className="text-blue-500"/> ตารางงานวันนี้</h3>
                    <div className="flex-1 overflow-y-auto custom-scroll space-y-3 pr-2">
                        {dailyAppointments.length > 0 ? (
                            dailyAppointments.map(appt => (
                                <div key={appt.id} className={`p-4 rounded-xl border-l-4 flex justify-between items-start group transition-all hover:shadow-md ${theme === 'dark' ? 'bg-slate-700 border-blue-500' : 'bg-blue-50 border-blue-500 hover:bg-white border shadow-sm'}`}>
                                    <div>
                                        <div className="flex items-baseline gap-2">
                                            <span className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-blue-700'}`}>{appt.time} น.</span>
                                            <span className={`text-sm px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-slate-600' : 'bg-white border'} text-gray-500`}>{appt.location}</span>
                                        </div>
                                        <div className={`font-medium text-lg mt-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{appt.title}</div>
                                        <div className="text-sm text-gray-500 flex flex-col gap-1 mt-2">
                                            <div className="flex items-center gap-1"><User size={14}/> <span>ผู้ป่วย: {patientsList.find(p => (p.id === appt.patient_id || p.user_id === appt.patient_id))?.name || 'ไม่ระบุ'}</span></div>
                                            {appt.notes && <div className="flex items-center gap-1 opacity-70 italic"><MessageSquare size={14}/> <span>{appt.notes}</span></div>}
                                        </div>
                                    </div>
                                    <button onClick={() => handleOpenEdit(appt)} className="p-2 text-gray-400 hover:text-blue-500 transition-all"><Pencil size={18}/></button>
                                </div>
                            ))
                        ) : (<div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60"><Calendar size={64} className="mb-4 text-gray-300"/><p>ไม่มีนัดหมายในวันนี้</p></div>)}
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className={`w-full max-w-lg rounded-[2rem] p-8 shadow-2xl ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Calendar size={24}/></div>
                                <h3 className="text-xl font-bold">{editingApptId ? 'แก้ไขนัดหมาย' : 'ลงเวลานัดหมายใหม่'}</h3>
                            </div>
                            <button onClick={() => {setShowModal(false); setEditingApptId(null);}} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        
                        <form onSubmit={handleSaveAppointment} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold flex items-center gap-2 opacity-70"><User size={14}/> เลือกผู้ป่วยในการดูแล</label>
                                <select 
                                    className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                                    value={newAppt.patient_id}
                                    onChange={e => setNewAppt({...newAppt, patient_id: e.target.value})}
                                    required
                                >
                                    <option value="">-- เลือกรายชื่อผู้ป่วย --</option>
                                    {myPatients.map(p => (
                                        <option key={p.user_id || p.id} value={p.user_id || p.id}>
                                            {p.name || `${p.title_th || ''}${p.first_name_th || ''} ${p.last_name_th || ''}`} {p.hn ? `(HN: ${p.hn})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold flex items-center gap-2 opacity-70"><ClipboardList size={14}/> ประเภทนัดหมาย</label>
                                    <select 
                                        className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                                        value={newAppt.title}
                                        onChange={e => setNewAppt({...newAppt, title: e.target.value})}
                                    >
                                        <option value="นัดตรวจ">นัดตรวจ</option>
                                        <option value="นัดฟังผล">นัดฟังผล</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold flex items-center gap-2 opacity-70"><Clock size={14}/> เวลานัดหมาย</label>
                                    <input 
                                        type="time" 
                                        className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`} 
                                        value={newAppt.time} 
                                        onChange={e => setNewAppt({...newAppt, time: e.target.value})} 
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold flex items-center gap-2 opacity-70"><Calendar size={14}/> วันที่นัดหมาย</label>
                                <input 
                                    type="date" 
                                    className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`} 
                                    value={newAppt.date} 
                                    onChange={e => setNewAppt({...newAppt, date: e.target.value})} 
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold flex items-center gap-2 opacity-70"><MapPinned size={14}/> สถานที่นัดหมาย</label>
                                <input 
                                    type="text" 
                                    placeholder="เช่น ห้องปฏิบัติการโลหิตวิทยา 1"
                                    className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`} 
                                    value={newAppt.location} 
                                    onChange={e => setNewAppt({...newAppt, location: e.target.value})} 
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold flex items-center gap-2 opacity-70"><MessageSquare size={14}/> บันทึกเพิ่มเติม (ถ้ามี)</label>
                                <textarea 
                                    rows="2"
                                    className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none resize-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`} 
                                    value={newAppt.notes} 
                                    onChange={e => setNewAppt({...newAppt, notes: e.target.value})}
                                />
                            </div>

                            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 transition-all active:scale-[0.98] mt-2">
                                {editingApptId ? 'ยืนยันการแก้ไข' : 'ยืนยันการนัดหมาย'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorDashboard;