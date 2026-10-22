import ReactMarkdown from 'react-markdown';

interface StudyGuideViewerProps {
  content: string;
}

export function StudyGuideViewer({ content }: StudyGuideViewerProps) {
  return (
    <div className="prose prose-invert max-w-none text-zinc-300">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight mt-6 mb-4 pb-2 border-b border-white/[0.08]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <div className="mt-8 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-amber-400 rounded-full inline-block" />
              <h2 className="text-base md:text-lg font-semibold text-white tracking-tight m-0">
                {children}
              </h2>
            </div>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-amber-300 tracking-wide mt-5 mb-2 uppercase">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-sm md:text-[15px] leading-relaxed text-zinc-300 mb-4 font-light">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-2.5 my-4 pl-0 list-none">
              {children}
            </ul>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-2.5 text-sm md:text-[15px] text-zinc-300 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
              <div className="flex-1">{children}</div>
            </li>
          ),
          ol: ({ children }) => (
            <ol className="space-y-2.5 my-4 pl-0 list-none counter-reset-item">
              {children}
            </ol>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="text-amber-200/90 not-italic font-medium">
              {children}
            </em>
          ),
          hr: () => (
            <hr className="my-6 border-white/[0.08]" />
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 pl-4 border-l-2 border-amber-400/60 bg-amber-500/[0.03] py-2 pr-4 rounded-r-xl italic text-zinc-300 text-sm">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}