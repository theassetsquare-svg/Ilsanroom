import ProfileClient from "./ProfileClient";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function ProfilePage() {
  useDocumentMeta('내 찜 목록·후기·방문 기록 모아보기', '찜한 업소·작성한 후기·포인트 내역·등급 현황·알림 설정 한 곳에. 매일 출석 +10P, 후기 +500P, 친구 초대 +1000P 적립 시스템.');
  return <ProfileClient />;
}
