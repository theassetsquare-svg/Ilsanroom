interface OwnerReplyProps {
  ownerName?: string;
  reply: string;
  repliedAt: string;
}

export default function OwnerReply({ ownerName = '사장님', reply, repliedAt }: OwnerReplyProps) {
  return (
    <div className="mt-3 rounded-xl border border-violet-500/20 bg-violet-950/20 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-400">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          사장님 답변
        </span>
        <span className="text-[10px] text-neutral-600">{repliedAt}</span>
      </div>
      <p className="text-sm leading-relaxed text-neutral-400">{reply}</p>
    </div>
  );
}
