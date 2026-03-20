import JsonLd from '@/components/seo/JsonLd';

interface VenueJsonLdProps {
  venue: {
    nameKo: string;
    description: string;
    address: string;
    rating: number;
    reviewCount: number;
    openHours: string;
    category: string;
    regionKo: string;
    district?: string;
    slug: string;
    features: string[];
    priceEntry?: string;
    priceTable?: string;
    priceDrink?: string;
  };
  breadcrumbItems: { name: string; url: string }[];
  faqItems?: { question: string; answer: string }[];
  reviews?: { author: string; rating: number; text: string; date: string }[];
  siteUrl?: string;
}

export default function VenueJsonLd({ venue, breadcrumbItems, faqItems, reviews, siteUrl = 'https://ilsanroom.pages.dev' }: VenueJsonLdProps) {
  const categoryTypeMap: Record<string, string> = {
    club: 'NightClub',
    night: 'NightClub',
    lounge: 'BarOrPub',
    room: 'EntertainmentBusiness',
    yojeong: 'Restaurant',
    hoppa: 'BarOrPub',

  };

  const businessType = categoryTypeMap[venue.category] || 'LocalBusiness';

  // LocalBusiness
  const localBusiness: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': businessType,
    name: venue.nameKo,
    description: venue.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: venue.address || `${venue.regionKo} ${venue.nameKo}`,
      addressLocality: venue.district || venue.regionKo,
      addressRegion: venue.regionKo,
      addressCountry: 'KR',
    },
    openingHours: venue.openHours,
    url: `${siteUrl}/${venue.category === 'club' ? 'clubs' : venue.category === 'night' ? 'nights' : venue.category === 'lounge' ? 'lounges' : venue.category === 'room' ? 'rooms' : venue.category}/${venue.slug}`,
  };

  // aggregateRating — only when real reviews exist (ratingValue:0 = Google error)
  if (venue.rating > 0 && venue.reviewCount > 0) {
    localBusiness.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: venue.rating,
      reviewCount: venue.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (venue.priceEntry || venue.priceTable) {
    localBusiness.priceRange = venue.priceTable || venue.priceEntry || '';
  }

  // Add reviews if available
  if (reviews && reviews.length > 0) {
    localBusiness.review = reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.text,
      datePublished: r.date,
    }));
  }

  // BreadcrumbList
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
    })),
  };

  // FAQPage (optional)
  const faqPage = faqItems && faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  return (
    <>
      <JsonLd data={localBusiness} />
      <JsonLd data={breadcrumbList} />
      {faqPage && <JsonLd data={faqPage} />}
    </>
  );
}
