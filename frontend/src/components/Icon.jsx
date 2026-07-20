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

export default function Icon({ name, width = 20, height = 20, className = "" }) {
  const iconMap = {
    room: roomIcon,
    fee: feeIcon,
    note: complaintIcon,
    complaint: complaintIcon,
    check: attendanceIcon,
    attendance: attendanceIcon,
    users: attendanceIcon,
    chart: attendanceIcon,
    bell: bellIcon,
    notice: bellIcon,
    search: searchIcon,
    building: logoIcon,
    logo: logoIcon,
    home: homeIcon,
    settings: settingsIcon,
    logout: logoutIcon,
    user: userIcon,
    eye: eyeIcon,
    'eye-off': eyeOffIcon,
    checkmark: checkmarkIcon
  }

  const src = iconMap[name] || roomIcon
  return <img src={src} alt={name || "icon"} width={width} height={height} className={className} />
}
