import ProfileClient from "./ProfileClient";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function ProfilePage() {
  useDocumentMeta('내 찜 목록·후기·방문 기록 모아보기', '찜한 업소·작성한 후기·등급 현황·알림 설정 한 곳에서 관리. 다녀온 곳, 가보고 싶은 곳, 친구에게 알려주고 싶은 곳을 내 페이지에서 확인.');
  return <ProfileClient />;
}
