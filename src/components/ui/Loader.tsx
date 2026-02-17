interface LoaderProps{ 
   className?: string;
}


export default function Loader({ className } : LoaderProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative mb-4">
        {/* Тонкое кольцо */}
        <div className="animate-spin rounded-full h-16 w-16 border-2 border-transparent border-t-blue-500 border-r-transparent"></div>
      </div>
      <div className="text-gray-500 font-medium tracking-wide">
        Загрузка данных<span className="loading-dots"></span>
      </div>
      <div className="mt-2 text-gray-400 text-sm">Пожалуйста, подождите</div>
    </div>
  );
}
