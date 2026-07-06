import {
  BookOpenText,
  GraduationCap,
  Settings,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import type { UserSummary } from "../../entities/user/model/types";

export type WebMenuId = "vocabulary" | "vocaQuiz" | "profile" | "settings";

export type WebMenu = {
  id: WebMenuId;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  children?: string[];
};

export const WEB_HEADER_MENUS: WebMenu[] = [
  {
    id: "vocabulary",
    label: "단어장",
    subtitle: "기본 어휘 3000 · 검색",
    icon: BookOpenText,
  },
  {
    id: "vocaQuiz",
    label: "단어 퀴즈",
    subtitle: "4지선다 · 난이도별 출제",
    icon: GraduationCap,
  },
  {
    id: "settings",
    label: "설정",
    subtitle: "계정 · 앱 환경",
    icon: Settings,
  },
];

export const PROFILE_MENU: WebMenu = {
  id: "profile",
  label: "프로필",
  subtitle: "내 계정 · 권한 정보",
  icon: UserCircle,
};

export function canAccessMenu(user: UserSummary | null, menu: WebMenuId) {
  return user !== null && [...WEB_HEADER_MENUS, PROFILE_MENU].some((item) => item.id === menu);
}
