import roomIcon from '../assets/icons/room.png'
import feeIcon from '../assets/icons/fee.png'
import complaintIcon from '../assets/icons/complaint.png'
import attendanceIcon from '../assets/icons/attendance.png'
import bellIcon from '../assets/icons/bell.png'
import searchIcon from '../assets/icons/search.png'

export default function Icon({ name, width = 20, height = 20, className = "" }) {
  if (name === 'building') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={width} height={height} className={className}>
        <path d="M6 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M2 22h20M10 8h.01M14 8h.01M10 12h.01M14 12h.01M10 16h.01M14 16h.01" />
      </svg>
    )
  }

  const iconMap = {
    room: roomIcon,
    fee: feeIcon,
    note: complaintIcon,
    check: attendanceIcon,
    users: attendanceIcon,
    chart: attendanceIcon,
    bell: bellIcon,
    search: searchIcon
  }

  const src = iconMap[name] || roomIcon
  return <img src={src} alt={name || "icon"} width={width} height={height} className={className} />
}
