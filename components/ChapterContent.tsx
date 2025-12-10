import React from 'react';

interface ChapterContentProps {
  title: string;
  content: string;
  isLoading: boolean;
}

export const ChapterContent: React.FC<ChapterContentProps> = ({ title, content, isLoading }) => {
  // Simple parser to render markdown basics (headers, lists, bold)
  const renderContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-bold text-slate-800 mt-8 mb-4">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-bold text-slate-800 mt-10 mb-5 border-b pb-2 border-slate-200">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('# ')) {
        // Usually handled by the main title prop, but if AI adds it:
        return <h1 key={index} className="text-3xl font-bold text-slate-900 mt-10 mb-6">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={index} className="ml-6 list-disc text-slate-700 mb-2 pl-2 marker:text-slate-400">{line.replace(/^[-*] /, '')}</li>;
      }
      if (line.match(/^\d+\. /)) {
        return <li key={index} className="ml-6 list-decimal text-slate-700 mb-2 pl-2 marker:text-slate-500">{line.replace(/^\d+\. /, '')}</li>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      
      // Basic bold parsing
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={index} className="text-slate-700 leading-8 mb-5 font-serif text-lg text-justify tracking-wide">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 md:p-16 shadow-lg rounded-sm min-h-[80vh] print:shadow-none">
      <div className="mb-12 text-center border-b pb-8 border-slate-100">
        <span className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase mb-2 block">Capítulo</span>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 leading-tight">{title}</h1>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse mt-8">
          <div className="h-4 bg-slate-100 rounded w-full"></div>
          <div className="h-4 bg-slate-100 rounded w-full"></div>
          <div className="h-4 bg-slate-100 rounded w-11/12"></div>
          <div className="h-4 bg-slate-100 rounded w-full"></div>
          
          <div className="h-8 bg-slate-200 rounded w-1/3 mt-8 mb-4"></div>
          
          <div className="h-4 bg-slate-100 rounded w-full"></div>
          <div className="h-4 bg-slate-100 rounded w-full"></div>
          <div className="h-4 bg-slate-100 rounded w-4/5"></div>
        </div>
      ) : (
        <div className="prose prose-slate prose-lg max-w-none">
          {renderContent(content)}
        </div>
      )}
      
      {!isLoading && (
        <div className="mt-16 pt-8 border-t border-slate-100 text-center">
           <span className="text-slate-300">***</span>
        </div>
      )}
    </div>
  );
};