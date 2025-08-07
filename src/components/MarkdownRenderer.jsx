import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown (tables, task lists, etc.)
import rehypeRaw from 'rehype-raw'; // To allow raw HTML in markdown (e.g., for custom components)
import rehypeSanitize from 'rehype-sanitize'; // To sanitize HTML and prevent layout-breaking elements
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

const MarkdownRenderer = ({ markdownContent, noteColour = "default" }) => {
  // Custom sanitization schema to allow only safe inline HTML elements
  const sanitizeSchema = useMemo(() => ({
    tagNames: [
      // Markdown elements
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark',
      'ul', 'ol', 'li',
      'blockquote',
      'a',
      'img',
      'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'input', // For checkboxes in task lists
      // Safe inline HTML elements
      'span', 'small', 'sub', 'sup', 'kbd', 'samp', 'var', 'time', 'abbr', 'dfn'
    ],
    attributes: {
      '*': ['className', 'id'],
      'a': ['href', 'title', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'input': ['type', 'checked', 'disabled'],
      'th': ['scope', 'colspan', 'rowspan'],
      'td': ['colspan', 'rowspan'],
      'abbr': ['title'],
      'dfn': ['title'],
      'time': ['datetime']
    }
  }), []);

  const markdownComponents = useMemo(() => ({
    h1: ({ node, ...props }) => <h1 className={`text-4xl font-bold pb-[0.7rem] mt-2 mb-5 border-b text-gray-900 ${noteColour === "default" ? "dark:text-white border-gray-300" : "border-gray-600"}`} {...props} />,
    h2: ({ node, ...props }) => <h2 className={`text-3xl font-bold pb-[0.5rem] mt-1 mb-5 border-b text-gray-900 ${noteColour === "default" ? "dark:text-white border-gray-300" : "border-gray-600"}`} {...props} />,
    h3: ({ node, ...props }) => <h3 className={`text-2xl font-semibold mt-1 mb-4 text-gray-800 ${noteColour === "default" ? "dark:text-white" : ""}`} {...props} />,
    h4: ({ node, ...props }) => <h4 className={`text-xl font-medium mt-1 mb-4 text-gray-800 ${noteColour === "default" ? "dark:text-white" : ""}`} {...props} />,
    h5: ({ node, ...props }) => <h5 className={`text-lg font-medium mt-1 mb-3 text-gray-700 ${noteColour === "default" ? "dark:text-white" : ""}`} {...props} />,
    h6: ({ node, ...props }) => <h6 className={`text-[1.05rem] font-medium mt-1 mb-3 text-gray-700 ${noteColour === "default" ? "dark:text-white" : ""}`} {...props} />,
    p: ({ node, ...props }) => <p className={`text-base leading-normal text-gray-800 mb-3 ${noteColour === "default" ? "dark:text-gray-200" : ""}`} {...props} />,
    a: ({ node, ...props }) => <a className="text-base text-blue-600 hover:underline dark:text-blue-400" target="_blank" rel="noopener noreferrer" {...props} />,
    ul: ({ node, className = '', ...props }) => <ul className={`list-disc list-inside pl-4 mb-3 text-gray-700 marker:text-gray-500 ${noteColour === "default" ? "dark:text-gray-100 dark:marker:text-gray-100" : ""}`} {...props} />,
    ol: ({ node, className = '', ...props }) => <ol className={`list-decimal list-inside pl-4 mb-3 text-gray-700 marker:text-gray-500 ${noteColour === "default" ? "dark:text-gray-100 dark:marker:text-gray-100" : ""}`} {...props} />,
    li: ({ node, ...props }) => <li className={`text-base my-1 text-gray-800 ${noteColour === "default" ? "dark:text-gray-200" : ""}`} {...props} />,
    strong: ({ node, ...props }) => (
      <strong className={`text-gray-900 ${noteColour === "default" ? "dark:text-white" : ""} font-bold`} {...props} />
    ),
    em: ({ node, ...props }) => (
      <em className={`text-gray-900 ${noteColour === "default" ? "dark:text-white" : ""}`} {...props} />
    ),
    pre: ({ node, ...props }) => (
      <pre 
        className="bg-gray-800 text-white p-3 mb-3 rounded-md overflow-x-hidden"
        style={{
          // Optimize performance during drag operations
          contain: 'layout style',
          willChange: 'auto'
        }}
        {...props} 
      />
    ),
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
          <pre 
            className="bg-gray-800 text-white px-1 py-0 mt-3 mb-3 rounded-md overflow-x-hidden"
            style={{
              // Optimize performance during drag operations
              contain: 'layout style',
              willChange: 'auto',
              // Reduce complexity during drag
              backfaceVisibility: 'hidden',
              transform: 'translateZ(0)' // Force GPU acceleration
            }}
          >
            <code 
              className="text-sm overflow-x-hidden whitespace-pre-wrap block custom-scrollbar" 
              style={{
                // Prevent layout thrashing during drag
                contain: 'layout',
                willChange: 'auto'
              }}
              {...props}
            >
              {content}
            </code>
          </pre>
        );
      }
      // Don't render anything for empty inline code
      if (content.trim() === '') {
        return null;
      }
      return (
        <code 
          className="not-prose bg-gray-200 dark:bg-gray-800 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded text-sm font-mono" 
          style={{
            // Optimize inline code as well
            contain: 'layout style',
            willChange: 'auto'
          }}
          {...props}
        >
          {content}
        </code>
      );
    },
    input: ({ node, ...props }) => (
      <span className="relative w-4 h-4 mr-2 inline-block">
        <input type="checkbox"
          className={`peer appearance-none w-[15px] h-[15px] border border-gray-400 rounded-sm bg-white checked:bg-purple-600 ${noteColour === "default" ? "dark:checked:bg-purple-400" : ""} focus:outline-none focus:ring-2 focus:ring-purple-500`} {...props} />
        <FontAwesomeIcon icon={faCheck} className="pointer-events-none text-white text-sm absolute top-[6px] left-[1px] hidden peer-checked:block" />
      </span>
    ),
    table: ({ node, ...props }) => (
      <div 
        className="overflow-x-auto -mt-5 -mb-3"
        style={{
          contain: 'layout style',
          willChange: 'auto'
        }}
      >
        <table className="w-full border-collapse min-w-full" {...props} />
      </div>
    ),
    thead: ({ node, ...props }) => <thead className={noteColour === "default" ? "bg-gray-300 dark:bg-gray-700" : "bg-gray-300"} {...props} />,
    th: ({ node, ...props }) => <th className={`border border-gray-400 px-4 py-2 text-left font-semibold text-gray-900 ${noteColour === "default" ? "dark:text-white dark:border-gray-500" : ""}`} {...props} />,
    td: ({ node, ...props }) => <td className={`border border-gray-400 px-4 py-2 text-gray-700 ${noteColour === "default" ? "dark:text-gray-200 dark:border-gray-500" : ""}`} {...props} />,
    hr: ({ node, ...props }) => <hr className={`mt-6 mb-6 border-t ${noteColour === "default" ? "border-gray-300 dark:border-gray-100" : "border-gray-600"}`} {...props} />,
    blockquote: ({ node, ...props }) => (
      <blockquote 
        className={`border-l-4 border-blue-500 pl-4 py-2 bg-[#deebf7] text-blue-800 italic ${noteColour === "default" ? "dark:bg-blue-900 dark:text-blue-200" : ""}`}
        style={{
          contain: 'layout style',
          willChange: 'auto'
        }}
        {...props} 
      />
    ),
    // Handle potentially dangerous HTML elements by converting them to safe equivalents
    div: ({ node, ...props }) => <span className="inline" {...props} />,
    section: ({ node, ...props }) => <span className="inline" {...props} />,
    article: ({ node, ...props }) => <span className="inline" {...props} />,
    aside: ({ node, ...props }) => <span className="inline" {...props} />,
    header: ({ node, ...props }) => <span className="inline" {...props} />,
    footer: ({ node, ...props }) => <span className="inline" {...props} />,
    main: ({ node, ...props }) => <span className="inline" {...props} />,
    nav: ({ node, ...props }) => <span className="inline" {...props} />
  }), [noteColour]);

  return (
    <div 
      className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
      style={{
        // Optimize the entire markdown container
        contain: 'layout style',
        willChange: 'auto'
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]} // remarkPlugins are for parsing Markdown syntax (e.g., GFM for tables, task lists)
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]} // rehypePlugins are for processing the HTML output
        components={markdownComponents} // Customize specific Markdown elements
      >
        {markdownContent}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer;