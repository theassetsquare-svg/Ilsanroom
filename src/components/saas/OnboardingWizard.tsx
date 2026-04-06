import { Link } from 'react-router-dom';

export default function OnboardingWizard() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8 text-center">
      <p className="text-4xl mb-4">💬</p>
      <h2 className="text-xl font-bold mb-2" style={{ color: '#111' }}>업소 입점 문의</h2>
      <p className="text-3xl font-black mb-2" style={{ color: '#8B5CF6' }}>카카오톡 besta12</p>
      <p className="text-sm mb-6" style={{ color: '#555' }}>카카오톡에서 besta12를 검색해서 문의해주세요</p>
      <Link to="/" className="inline-block rounded-xl px-6 py-3 text-sm font-bold text-white" style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}>
        홈으로
      </Link>
    </div>
  );
}
