export const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
export const DEFAULT_NATIONALITIES = ["ไทย (Thailand)", "ลาว (Laos)", "พม่า (Myanmar)", "กัมพูชา (Cambodia)", "เวียดนาม (Vietnam)", "จีน (China)", "ญี่ปุ่น (Japan)", "สหรัฐอเมริกา (USA)", "อังกฤษ (UK)", "อื่นๆ (Other)"];
export const RELIGIONS = ["พุทธ", "คริสต์", "อิสลาม", "ฮินดู", "ซิกข์", "ไม่นับถือ", "อื่นๆ"];
export const FALLBACK_PROVINCES = ["กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "พระนครศรีอยุธยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "พะเยา", "ภูเก็ต", "มหาสารคาม", "แม่ฮ่องสอน", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "อ่างทอง", "อุดรธานี", "อุตรดิตถ์", "อุบลราชธานี"];

export const formatThaiDateFull = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; 
    const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    return `วัน${THAI_DAYS[date.getDay()]} ที่ ${date.getDate()} ${THAI_MONTHS[date.getMonth()]} พ.ศ. ${date.getFullYear() + 543}`;
};

export const calculateAge = (dobString) => {
    if (!dobString) return '-';
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return '-';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};