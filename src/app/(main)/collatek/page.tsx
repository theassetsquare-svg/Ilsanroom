import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: '콜라텍 | 오늘밤어디',
  description: '콜라텍 카테고리는 현재 운영되지 않습니다.',
};

export default function CollatekPage() {
  redirect('/');
}
