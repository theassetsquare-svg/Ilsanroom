import ProfileClient from "./ProfileClient";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function ProfilePage() {
  useDocumentMeta('마이페이지 | 플밤', '내 프로필, 찜한 업소, 리뷰 관리.');
  return <ProfileClient />;
}
