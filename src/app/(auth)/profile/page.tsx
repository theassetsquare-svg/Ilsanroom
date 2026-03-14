import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "프로필 - 오늘밤어디",
  description: "오늘밤어디 프로필 관리. 내 정보 수정, 구독 관리, 계정 설정.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
