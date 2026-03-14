import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getVenueBySlug, venues } from '@/data/venues';
import PrintButton from '@/components/ui/PrintButton';

export function generateStaticParams() {
  return venues
    .filter((v) => v.status !== 'closed_or_unclear')
    .map((v) => ({ slug: v.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) return { title: '업소를 찾을 수 없습니다' };
  return {
    title: `${venue.nameKo} - 프린트용 | 일산룸포털`,
    robots: { index: false, follow: false },
  };
}

export default async function PrintPage({ params }: Props) {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) notFound();

  const categoryLabels: Record<string, string> = {
    club: '클럽', night: '나이트', lounge: '라운지',
    room: '룸', yojeong: '요정', hoppa: '호빠', collatek: '콜라텍',
  };

  return (
    <div className="mx-auto max-w-2xl bg-white px-8 py-12 text-black print:p-0">
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          header, footer, nav, .no-print { display: none !important; }
          .print-page { padding: 0 !important; margin: 0 !important; }
        }
        @media screen {
          .print-page {
            background: white; color: black;
            border-radius: 16px; border: 1px solid #e5e5e5;
          }
        }
      `}</style>

      <div className="print-page">
        {/* Header */}
        <div className="mb-8 border-b-2 border-black pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold">{venue.nameKo}</h1>
              <p className="mt-1 text-sm text-neutral-600">
                {venue.regionKo} · {categoryLabels[venue.category] || venue.category}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500">일산룸포털</p>
              <p className="text-xs text-neutral-500">ilsanroom.pages.dev</p>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold">{venue.rating}</span>
            <span className="text-amber-500">★</span>
          </div>
          <span className="text-sm text-neutral-600">리뷰 {venue.reviewCount}개</span>
          {venue.isPremium && (
            <span className="rounded-full border border-amber-500 px-2 py-0.5 text-xs font-bold text-amber-600">PREMIUM</span>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-bold">소개</h2>
          <p className="text-sm leading-relaxed text-neutral-700">{venue.description}</p>
        </div>

        {/* Info Grid */}
        <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-neutral-200 p-4">
          <div><span className="text-xs text-neutral-500">위치</span><p className="text-sm">{venue.address}</p></div>
          <div><span className="text-xs text-neutral-500">영업시간</span><p className="text-sm">{venue.openHours}</p></div>
          <div><span className="text-xs text-neutral-500">연령대</span><p className="text-sm">{venue.ageGroup}</p></div>
          <div><span className="text-xs text-neutral-500">드레스코드</span><p className="text-sm">{venue.dressCode}</p></div>
          <div><span className="text-xs text-neutral-500">주차</span><p className="text-sm">{venue.parking}</p></div>
          <div><span className="text-xs text-neutral-500">가까운 역</span><p className="text-sm">{venue.nearbyStation}</p></div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-bold">특징</h2>
          <ul className="grid grid-cols-2 gap-1">
            {venue.features.map((f) => (
              <li key={f} className="flex items-center gap-1.5 text-sm">
                <span>•</span> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Price Info */}
        {(venue.priceEntry || venue.priceTable || venue.priceDrink) && (
          <div className="mb-6">
            <h2 className="mb-2 text-lg font-bold">가격 안내</h2>
            <div className="rounded-lg border border-neutral-200 p-4 text-sm">
              {venue.priceEntry && <p>입장료: {venue.priceEntry}</p>}
              {venue.priceTable && <p>테이블: {venue.priceTable}</p>}
              {venue.priceDrink && <p>음료: {venue.priceDrink}</p>}
            </div>
          </div>
        )}

        {/* QR Code placeholder */}
        <div className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-4">
          <p className="text-xs text-neutral-500">
            이 정보는 일산룸포털에서 제공합니다. 방문 전 업소에 직접 확인하세요.
          </p>
          <div className="h-16 w-16 rounded border border-neutral-300 bg-neutral-100 flex items-center justify-center text-[8px] text-neutral-400">
            QR
          </div>
        </div>

        {/* Print button (screen only) */}
        <div className="mt-6 text-center no-print">
          <PrintButton />
        </div>
      </div>
    </div>
  );
}
