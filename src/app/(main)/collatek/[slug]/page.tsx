import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return [{ slug: '_placeholder' }];
}

export default async function CollatekDetailPage({ params }: Props) {
  redirect('/');
}
