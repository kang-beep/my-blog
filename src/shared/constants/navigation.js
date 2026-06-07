import {
  Briefcase,
  FolderKanban,
  Home,
  LibraryBig,
  SquarePen,
  UserRound,
} from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";

export const SITE_NAME = "kang-beep tech";

export const ICON_SIZE = 16;
export const ICON_STROKE = 1.75;

export const PUBLIC_NAV = [
  { to: ROUTES.HOME, label: "홈", end: true, icon: Home },
  { to: ROUTES.POSTS, label: "글 목록", end: false, icon: LibraryBig },
  { to: ROUTES.PORTFOLIO, label: "포트폴리오", end: true, icon: Briefcase },
];

export const ADMIN_NAV = [
  { to: ROUTES.ADMIN_PROFILE, label: "프로필", end: true, icon: UserRound },
  { to: ROUTES.ADMIN_POSTS, label: "포스트", end: false, icon: SquarePen },
  { to: ROUTES.ADMIN_PORTFOLIO, label: "포트폴리오", end: true, icon: FolderKanban },
];
