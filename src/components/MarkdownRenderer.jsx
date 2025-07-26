import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown (tables, task lists, etc.)
import rehypeRaw from 'rehype-raw'; // To allow raw HTML in markdown (e.g., for custom components)
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

const MarkdownRenderer = ({ markdownContent }) => {
  const markdownComponents = useMemo(() => ({
    h1: ({ node, ...props }) => <h1 className="text-4xl font-bold pb-[0.7rem] mt-2 mb-5 border-b border-gray-300 text-gray-900 dark:text-white" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-3xl font-bold pb-[0.5rem] mt-1 mb-5 border-b border-gray-300 text-gray-900 dark:text-white" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-2xl font-semibold mt-1 mb-4 text-gray-800 dark:text-white" {...props} />,
    h4: ({ node, ...props }) => <h4 className="text-xl font-medium mt-1 mb-4 text-gray-800 dark:text-white" {...props} />,
    h5: ({ node, ...props }) => <h5 className="text-lg font-medium mt-1 mb-3 text-gray-700 dark:text-white" {...props} />,
    h6: ({ node, ...props }) => <h6 className="text-[1.05rem] font-medium mt-1 mb-3 text-gray-700 dark:text-white" {...props} />,
    p: ({ node, ...props }) => <p className="text-base leading-tight text-gray-800 dark:text-gray-200" {...props} />,
    a: ({ node, ...props }) => <a className="text-blue-600 hover:underline dark:text-blue-400" {...props} />,
    ul: ({ node, className = '', ...props }) => <ul className="list-disc list-inside pl-4 text-gray-700 dark:text-gray-100 marker:text-gray-500 dark:marker:text-gray-100" {...props} />,
    ol: ({ node, className = '', ...props }) => <ol className="list-decimal list-inside pl-4 text-gray-700 dark:text-gray-100 marker:text-gray-500 dark:marker:text-gray-100" {...props} />,
    li: ({ node, ...props }) => <li className="my-1 text-gray-800 dark:text-gray-200" {...props} />,
    strong: ({ node, ...props }) => (
      <strong className="text-gray-900 dark:text-white font-bold" {...props} />
    ),
    em: ({ node, ...props }) => (
      <em className="text-gray-900 dark:text-white" {...props} />
    ),
    pre: ({ node, ...props }) => <pre className="bg-gray-800 text-white p-0 rounded-md overflow-x-auto" {...props} />,
    code: ({ inline, className = '', children, ...props }) => {
      let content = '';
      if (Array.isArray(children)) {
        content = children.join('');
      } else if (typeof children === 'string') {
        content = children;
      }
      const hasLineBreak = content.includes('\n');
      const isBlock = className?.startsWith('language-') || hasLineBreak;
      if (isBlock) {
        return (
          <pre className="bg-gray-800 text-white py-0 mt-3 mb-3 rounded-md overflow-x-auto">
            <code className="text-sm overflow-x-auto whitespace-pre-wrap" {...props}>
              {content}
            </code>
          </pre>
        );
      }
      // Don’t render anything for empty inline code
      if (content.trim() === '') {
        return null;
      }
      return (
        <code className="not-prose bg-gray-200 dark:bg-gray-800 text-purple-700 dark:text-purple-400 px-1.5 py-1 rounded text-sm font-mono" {...props}>
          {content}
        </code>
      );
    },
    input: ({ node, ...props }) => (
      <span className="relative w-4 h-4 mr-2 inline-block">
        <input
          type="checkbox"
          className="peer appearance-none w-[15px] h-[15px] border border-gray-400 rounded-sm bg-white
                 checked:bg-purple-600 dark:checked:bg-purple-400
                 focus:outline-none focus:ring-2 focus:ring-purple-500"
          {...props}
        />
        <FontAwesomeIcon icon={faCheck} className="pointer-events-none text-white text-sm absolute top-[6px] left-[1px] hidden peer-checked:block" />
      </span>
    ),
    table: ({ node, ...props }) => <table className="w-full border-collapse overflow-x-auto" {...props} />,
    thead: ({ node, ...props }) => <thead className="bg-gray-300 dark:bg-gray-700" {...props} />,
    th: ({ node, ...props }) => <th className="border border-gray-400 dark:border-gray-500 px-4 py-2 text-left font-semibold text-gray-900 dark:text-white" {...props} />,
    td: ({ node, ...props }) => <td className="border border-gray-400 dark:border-gray-500 px-4 py-2 text-gray-700 dark:text-gray-200" {...props} />,
    hr: ({ node, ...props }) => <hr className="mt-3 mb-3 border-t border-gray-300 dark:border-gray-100" {...props} />,
    blockquote: ({ node, ...props }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 py-1 mt-0 mb-0 bg-[#deebf7] text-blue-800 italic dark:bg-blue-900 dark:text-blue-200" {...props} />
    )
  }), []);

  return (
    <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]} // remarkPlugins are for parsing Markdown syntax (e.g., GFM for tables, task lists)
        rehypePlugins={[rehypeRaw]} // rehypePlugins are for processing the HTML output (e.g., rehypeRaw for raw HTML)
        components={markdownComponents} // Customize specific Markdown elements
      >
        {markdownContent}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer;