import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BookOpen, 
  Download, 
  Library, 
  Loader2, 
  PenTool, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AppState, Chapter, EbookData } from './types';
import { generateEbookOutline, generateBookCover, generateChapterContent, hasApiKey } from './services/geminiService';
import { ChapterContent } from './components/ChapterContent';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [topic, setTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Data State
  const [ebookData, setEbookData] = useState<EbookData | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [generatedChaptersCount, setGeneratedChaptersCount] = useState(0);

  // Refs for managing the generation queue
  const isGeneratingRef = useRef(false);

  // Initialize Outline Generation
  const handleStartGeneration = async () => {
    if (!topic.trim()) return;
    if (!hasApiKey()) {
      setError("API Key não encontrada. Configure a variável de ambiente process.env.API_KEY.");
      return;
    }

    setAppState(AppState.PLANNING);
    setError(null);
    setEbookData(null);
    setGeneratedChaptersCount(0);
    setSelectedChapterId(null);

    try {
      const outline = await generateEbookOutline(topic);
      
      const initialChapters: Chapter[] = outline.chapters.map(c => ({
        ...c,
        content: '',
        status: 'pending'
      }));

      const newEbook: EbookData = {
        title: outline.title,
        description: outline.description,
        targetAudience: outline.targetAudience,
        coverImageBase64: null,
        chapters: initialChapters,
        isGeneratingCover: true
      };

      setEbookData(newEbook);
      setAppState(AppState.CREATING);

      // Trigger parallel start of Cover and Content
      triggerCoverGeneration(newEbook.title, topic, newEbook.targetAudience);
      triggerContentGeneration(initialChapters, newEbook.title, newEbook.description);

    } catch (err) {
      setError("Falha ao criar o plano do e-book. Tente um tópico diferente ou mais específico.");
      setAppState(AppState.IDLE);
      console.error(err);
    }
  };

  const triggerCoverGeneration = async (title: string, topic: string, audience: string) => {
    try {
      const base64Image = await generateBookCover(title, topic, audience);
      setEbookData(prev => prev ? { ...prev, coverImageBase64: base64Image, isGeneratingCover: false } : null);
    } catch (e) {
      console.error("Cover generation failed", e);
      setEbookData(prev => prev ? { ...prev, isGeneratingCover: false } : null);
    }
  };

  const triggerContentGeneration = async (chapters: Chapter[], bookTitle: string, bookDesc: string) => {
    // Generate chapters sequentially to avoid rate limits and maintain context order if we were using history (which we aren't, but it's good practice)
    const context = `Título: ${bookTitle}. Descrição: ${bookDesc}.`;

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      
      // Update status to generating
      setEbookData(prev => {
        if (!prev) return null;
        const newChapters = [...prev.chapters];
        newChapters[i] = { ...newChapters[i], status: 'generating' };
        return { ...prev, chapters: newChapters };
      });
      
      // If it's the first chapter, select it so user can read immediately
      if (i === 0) setSelectedChapterId(chapter.id);

      try {
        const content = await generateChapterContent(chapter.title, bookTitle, context);
        
        setEbookData(prev => {
          if (!prev) return null;
          const newChapters = [...prev.chapters];
          newChapters[i] = { ...newChapters[i], status: 'completed', content };
          return { ...prev, chapters: newChapters };
        });
        setGeneratedChaptersCount(prev => prev + 1);
      } catch (err) {
        setEbookData(prev => {
          if (!prev) return null;
          const newChapters = [...prev.chapters];
          newChapters[i] = { ...newChapters[i], status: 'error' };
          return { ...prev, chapters: newChapters };
        });
      }
    }
    
    setAppState(AppState.FINISHED);
  };

  const handleDownload = () => {
    alert("Funcionalidade de exportação PDF estaria aqui. (Simulação: Arquivo baixado!)");
  };

  // Renderers
  const renderHero = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in duration-700">
      <div className="w-full max-w-2xl text-center space-y-8">
        <div className="inline-flex items-center justify-center p-3 bg-brand-100 rounded-2xl mb-4">
          <Sparkles className="w-8 h-8 text-brand-600" />
        </div>
        <h1 className="text-5xl md:text-6xl font-serif font-bold text-slate-900 tracking-tight">
          Crie seu Best-Seller
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed max-w-lg mx-auto">
          Transforme uma ideia em um e-book completo e vendável em minutos. Com capa, capítulos e estratégia de vendas.
        </p>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-teal-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-white rounded-lg shadow-xl p-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Sobre o que você quer escrever? (Ex: Marketing Digital para Iniciantes)"
              className="flex-1 p-4 outline-none text-lg text-slate-700 placeholder:text-slate-400 bg-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleStartGeneration()}
            />
            <button
              onClick={handleStartGeneration}
              disabled={!topic.trim() || !hasApiKey()}
              className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-md font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {appState === AppState.PLANNING ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>Gerar <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </div>
        
        {!hasApiKey() && (
           <div className="text-red-500 text-sm mt-2 flex items-center justify-center gap-2">
             <AlertCircle size={16} /> API Key ausente. Verifique o README ou metadata.
           </div>
        )}

        <div className="flex items-center justify-center gap-8 text-sm text-slate-400 mt-8">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-500"/> Capa Inclusa</span>
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-500"/> 10 Capítulos</span>
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-500"/> Pronto para Venda</span>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => {
    if (!ebookData) return null;

    const selectedChapter = ebookData.chapters.find(c => c.id === selectedChapterId);

    return (
      <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-slate-50">
        {/* Sidebar */}
        <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-lg">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2 text-brand-700 font-bold uppercase text-xs tracking-wider mb-2">
              <Library className="w-4 h-4" /> E-book Factory
            </div>
            <h2 className="font-serif font-bold text-slate-900 leading-tight line-clamp-2">
              {ebookData.title}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Capa & Informações</h3>
              <div 
                 onClick={() => setSelectedChapterId(null)} // Select dashboard/cover view
                 className={`cursor-pointer rounded-lg p-3 flex items-center gap-3 transition-colors ${selectedChapterId === null ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-50 text-slate-600'}`}
              >
                <BookOpen className="w-5 h-5" />
                <span className="font-medium text-sm">Visão Geral</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between px-2 mb-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Capítulos</h3>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  {generatedChaptersCount}/10
                </span>
              </div>
              
              <div className="space-y-1">
                {ebookData.chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => setSelectedChapterId(chapter.id)}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-all flex items-start gap-3
                      ${selectedChapterId === chapter.id 
                        ? 'bg-brand-50 border-brand-200 text-brand-900 shadow-sm ring-1 ring-brand-200' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium 
                      ${chapter.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        chapter.status === 'generating' ? 'bg-amber-100 text-amber-700 animate-pulse' : 
                        'bg-slate-100 text-slate-400'}`}>
                       {chapter.status === 'generating' ? <Loader2 className="w-3 h-3 animate-spin" /> : chapter.id}
                    </span>
                    <span className="line-clamp-2">{chapter.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100">
             <button 
               onClick={handleDownload}
               className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
             >
               <Download className="w-4 h-4" /> Exportar E-book
             </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 h-full overflow-y-auto bg-slate-100/50 p-4 md:p-8 relative">
          
          {selectedChapterId === null ? (
            // Cover / Overview View
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
              <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 flex flex-col md:flex-row gap-12 items-start">
                {/* Book Cover */}
                <div className="w-full md:w-1/3 flex-shrink-0">
                  <div className="aspect-[2/3] w-full rounded-lg shadow-2xl overflow-hidden bg-slate-200 relative group">
                    {ebookData.coverImageBase64 ? (
                       <img 
                        src={`data:image/png;base64,${ebookData.coverImageBase64}`} 
                        alt="Book Cover" 
                        className="w-full h-full object-cover"
                       />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                        {ebookData.isGeneratingCover ? (
                          <>
                            <Loader2 className="w-10 h-10 animate-spin mb-4 text-brand-500" />
                            <p className="text-sm">IA desenhando a capa...</p>
                          </>
                        ) : (
                          <p>Falha na capa</p>
                        )}
                      </div>
                    )}
                    
                    {/* Glossy Overlay Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-white/5 to-white/20 pointer-events-none mix-blend-overlay"></div>
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/20 to-transparent pointer-events-none"></div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-6">
                  <div>
                    <span className="inline-block px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-bold tracking-wide mb-4">
                      PRONTO PARA VENDA
                    </span>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 leading-tight mb-4">
                      {ebookData.title}
                    </h1>
                    <p className="text-lg text-slate-600 leading-relaxed">
                      {ebookData.description}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <PenTool className="w-4 h-4" /> Público Alvo
                    </h3>
                    <p className="text-slate-600 text-sm">
                      {ebookData.targetAudience}
                    </p>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button 
                      onClick={() => setSelectedChapterId(1)}
                      className="px-6 py-3 bg-brand-600 text-white font-semibold rounded-lg shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all hover:-translate-y-1"
                    >
                      Começar a Ler
                    </button>
                    {appState !== AppState.FINISHED && (
                       <div className="flex items-center gap-3 text-sm text-slate-500 bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-sm">
                         <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                         Escrevendo capítulos... ({generatedChaptersCount}/10)
                       </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats / Table of Contents Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="text-4xl font-bold text-slate-900 mb-1">10</div>
                    <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">Capítulos</div>
                 </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="text-4xl font-bold text-slate-900 mb-1">High</div>
                    <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">Resolução (Capa)</div>
                 </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="text-4xl font-bold text-slate-900 mb-1">A4</div>
                    <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">Formato</div>
                 </div>
              </div>
            </div>
          ) : (
            // Chapter Reader View
            <div className="animate-in fade-in duration-300">
              {selectedChapter ? (
                <ChapterContent 
                  title={selectedChapter.title}
                  content={selectedChapter.content}
                  isLoading={selectedChapter.status === 'generating' || selectedChapter.status === 'pending'}
                />
              ) : (
                <div>Capítulo não encontrado</div>
              )}
              
              {/* Navigation Footer */}
              <div className="max-w-3xl mx-auto flex justify-between mt-8 pb-12">
                 <button 
                   disabled={!selectedChapter || selectedChapter.id === 1}
                   onClick={() => setSelectedChapterId(prev => prev ? prev - 1 : 1)}
                   className="px-4 py-2 text-slate-500 hover:text-brand-600 disabled:opacity-30 disabled:hover:text-slate-500 font-medium transition-colors"
                 >
                   &larr; Anterior
                 </button>
                 <button 
                   disabled={!selectedChapter || selectedChapter.id === 10}
                   onClick={() => setSelectedChapterId(prev => prev ? prev + 1 : 1)}
                   className="px-4 py-2 text-slate-500 hover:text-brand-600 disabled:opacity-30 disabled:hover:text-slate-500 font-medium transition-colors"
                 >
                   Próximo &rarr;
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen font-sans selection:bg-brand-100 selection:text-brand-900">
      {appState === AppState.IDLE || appState === AppState.PLANNING && !ebookData ? renderHero() : renderDashboard()}
    </div>
  );
}

export default App;
