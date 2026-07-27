import roomIcon from '../assets/icons/room.png'
import feeIcon from '../assets/icons/fee.png'
import complaintIcon from '../assets/icons/complaint.png'
import attendanceIcon from '../assets/icons/attendance.png'
import bellIcon from '../assets/icons/bell.png'
import searchIcon from '../assets/icons/search.png'
import logoIcon from '../assets/icons/logo.png'
import homeIcon from '../assets/icons/home.png'
import settingsIcon from '../assets/icons/settings.png'
import logoutIcon from '../assets/icons/logout.png'
import userIcon from '../assets/icons/user.png'
import eyeIcon from '../assets/icons/eye.png'
import eyeOffIcon from '../assets/icons/eye-off.png'
import checkmarkIcon from '../assets/icons/checkmark.png'
import googleIcon from '../assets/icons/google.png'
import sunIcon from '../assets/icons/sun.png'
import moonIcon from '../assets/icons/moon.png'

export default function Icon({ name, width = 20, height = 20, className = "", style = {} }) {
  const iconMap = {
    room: roomIcon,
    bed: roomIcon,
    fee: feeIcon,
    payment: feeIcon,
    complaint: complaintIcon,
    maintenance: complaintIcon,
    note: complaintIcon,
    attendance: attendanceIcon,
    gatepass: attendanceIcon,
    pass: attendanceIcon,
    check: attendanceIcon,
    users: attendanceIcon,
    chart: attendanceIcon,
    bell: bellIcon,
    notice: bellIcon,
    broadcast: bellIcon,
    search: searchIcon,
    building: logoIcon,
    logo: logoIcon,
    home: homeIcon,
    settings: settingsIcon,
    logout: logoutIcon,
    user: userIcon,
    profile: userIcon,
    eye: eyeIcon,
    'eye-off': eyeOffIcon,
    checkmark: checkmarkIcon,
    google: googleIcon,
    sun: sunIcon,
    moon: moonIcon
  }

  if (name === 'chat' || name === 'message' || name === 'message-square') {
    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={width} 
        height={height} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className} 
        style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    );
  }

  const src = iconMap[name] || roomIcon
  return <img src={src} alt={name || "icon"} width={width} height={height} className={className} style={style} />
}
