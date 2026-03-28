import ProfileClient from "./ProfileClient";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function ProfilePage() {
  useDocumentMeta('마이페이지', '내가 찜한 곳, 남긴 후기, 방문 기록 한 곳에 모아둔 서랍.');
  return <ProfileClient />;
}
