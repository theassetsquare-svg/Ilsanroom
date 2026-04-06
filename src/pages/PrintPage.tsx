import { useParams , Navigate } from 'react-router-dom';

import { getVenueBySlug, venues } from '@/data/venues';
import PrintButton from '@/components/ui/PrintButton';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function PrintPage() {
  useDocumentMeta('매장 정보 인쇄', '업소 상세 정보를 종이로 출력할 수 있는 페이지.');
  const { slug } = useParams<{ slug: string }>();
  const venue = slug ? getVenueBySlug(slug) : undefined;

  if (!venue) {
    return <Navigate to="/" replace />;
  }

  const categoryLabels: Record<string, string> = {
    club: 'CLUB', night: 'NIGHT', lounge: 'LOUNGE',
    room: 'ROOM', yojeong: '한식주점', hoppa: 'HOPPA',
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
              <p className="mt-1 text-sm text-neon-text-muted">
                {venue.regionKo} · {categoryLabels[venue.category] || venue.category}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neon-text-muted">놀쿨</p>
              <p className="text-xs text-neon-text-muted">nolcool.com</p>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold">{venue.rating}</span>
            <span className="text-amber-500">★</span>
          </div>
          <span className="text-sm text-neon-text-muted">리뷰 {venue.reviewCount}개</span>
          {venue.isPremium && (
            <span className="rounded-full border border-amber-500 px-2 py-0.5 text-xs font-bold text-amber-600">PREMIUM</span>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-bold">한줄 요약</h2>
          <p className="text-sm leading-relaxed text-neutral-700">{venue.description}</p>
        </div>

        {/* Info Grid */}
        <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-neutral-200 p-4">
          <div><span className="text-xs text-neon-text-muted">주소</span><p className="text-sm">{venue.address}</p></div>
          <div><span className="text-xs text-neon-text-muted">운영 시간</span><p className="text-sm">{venue.openHours}</p></div>
          <div><span className="text-xs text-neon-text-muted">연령대</span><p className="text-sm">{venue.ageGroup}</p></div>
          <div><span className="text-xs text-neon-text-muted">착장 기준</span><p className="text-sm">{venue.dressCode}</p></div>
          <div><span className="text-xs text-neon-text-muted">주차</span><p className="text-sm">{venue.parking}</p></div>
          <div><span className="text-xs text-neon-text-muted">인근 역</span><p className="text-sm">{venue.nearbyStation}</p></div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-bold">핵심 포인트</h2>
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
            <h2 className="mb-2 text-lg font-bold">요금표</h2>
            <div className="rounded-lg border border-neutral-200 p-4 text-sm">
              {venue.priceEntry && <p>입장: {venue.priceEntry}</p>}
              {venue.priceTable && <p>좌석: {venue.priceTable}</p>}
              {venue.priceDrink && <p>드링크: {venue.priceDrink}</p>}
            </div>
          </div>
        )}

        {/* QR Code placeholder */}
        <div className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-4">
          <p className="text-xs text-neon-text-muted">
            이 자료는 놀쿨에서 가져온 내용입니다. 방문 전 매장에 직접 물어봐.
          </p>
          <div className="h-16 w-16 rounded border border-neutral-300 bg-neutral-100 flex items-center justify-center text-xs text-neon-text-muted">
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
