import {
  Briefcase,
  FolderKanban,
  Home,
  LibraryBig,
  Settings,
  SquarePen,
  UserRound,
} from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";

export const SITE_NAME = "kang-beep tech";

export const ICON_SIZE = 16;
export const ICON_STROKE = 1.75;

export const PUBLIC_NAV = [
  { to: ROUTES.HOME, label: "Home", end: true, icon: Home },
  { to: ROUTES.POSTS, label: "Posts", end: false, icon: LibraryBig },
  { to: ROUTES.PORTFOLIO, label: "Portfolio", end: true, icon: Briefcase },
];

export const ADMIN_NAV = [
  { to: ROUTES.ADMIN_PROFILE, label: "Profile Edit", end: true, icon: UserRound },
  { to: ROUTES.ADMIN_POSTS, label: "Post Edit", end: false, icon: SquarePen },
  { to: ROUTES.ADMIN_PORTFOLIO, label: "Portfolio Edit", end: true, icon: FolderKanban },
  { to: ROUTES.ADMIN_SETTINGS, label: "Settings", end: true, icon: Settings },
];
