import ProfileClient from "./ProfileClient";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function ProfilePage() {
  useDocumentMeta('내 찜 목록·후기·방문 기록 모아보기', '내가 찜한 업소, 작성한 후기, 포인트 내역까지 한 곳에.');
  return <ProfileClient />;
}
