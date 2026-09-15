// 헤더 네비 링크: 아이콘 + 라벨
import { NavLink } from "react-router-dom";
import { ICON_SIZE, ICON_STROKE } from "@/shared/constants/navigation";

function getHeaderNavClassName(isActive) {
  return isActive ? "header-nav-link header-nav-link-active" : "header-nav-link";
}

export default function HeaderNavLink({ to, end, label, icon: Icon }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => getHeaderNavClassName(isActive)}>
      <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />
      <span>{label}</span>
    </NavLink>
  );
}
