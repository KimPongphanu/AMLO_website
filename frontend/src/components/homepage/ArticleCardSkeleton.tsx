const ArticleCardSkeleton = () => (
  <div className='shrink-0 w-[260px] md:w-[320px] bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm flex flex-col animate-pulse'>
    <div className='h-[180px] md:h-[200px] w-full bg-slate-200'></div>
    <div className='p-4 md:p-5 flex flex-col flex-grow'>
      <div className='h-3 md:h-4 bg-slate-200 rounded w-1/4 mb-3'></div>
      <div className='h-5 md:h-6 bg-slate-200 rounded w-full mb-2'></div>
      <div className='h-5 md:h-6 bg-slate-200 rounded w-5/6 mb-4'></div>
      <div className='h-3 md:h-4 bg-slate-200 rounded w-full mb-2'></div>
      <div className='h-3 md:h-4 bg-slate-200 rounded w-full mb-2'></div>
      <div className='h-3 md:h-4 bg-slate-200 rounded w-2/3 mb-6'></div>
      <div className='mt-auto h-4 md:h-5 bg-slate-200 rounded w-1/3'></div>
    </div>
  </div>
)

export default ArticleCardSkeleton
