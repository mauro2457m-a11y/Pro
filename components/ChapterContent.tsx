import React from 'react';

interface ChapterContentProps {
  title: string;
  content: string;
  isLoading: boolean;
}

export const ChapterContent: React.FC<ChapterContentProps> = ({ title, content, isLoading }) => {
  // Simple parser to render markdown basics (headers, lists, bold)
  // In a real app we'd use react-markdown, but we are keeping dependencies minimal per constraints
  const renderContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-bold text-slate-800 mt-6 mb-3">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-bold text-slate-800 mt-8 mb-4 border-b pb-2">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold text-slate-900 mt-10 mb-6">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="ml-6 list-disc text-slate-700 mb-2">{line.replace('- ', '')}</li>;
      }
      if (line.startsWith('* ')) {
        return <li key={index} className="ml-6 list-disc text-slate-700 mb-2">{line.replace('* ', '')}</li>;
      }
      if (line.startsWith('1. ')) {
        return <li key={index} className="ml-6 list-decimal text-slate-700 mb-2">{line.replace(/^\d+\. /, '')}</li>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      
      // Basic bold parsing
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={index} className="text-slate-700 leading-relaxed mb-4 font-serif text-lg">
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
    <div className="max-w-3xl mx-auto bg-white p-8 md:p-16 shadow-sm min-h-[80vh]">
      <div className="mb-8 text-center border-b pb-8">
        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Capítulo</span>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mt-2">{title}</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          <div className="h-32 bg-slate-100 rounded w-full my-8"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-4/5"></div>
        </div>
      ) : (
        <div className="prose prose-slate prose-lg max-w-none">
          {renderContent(content)}
        </div>
      )}
    </div>
  );
};
