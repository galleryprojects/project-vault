export default function RestrictedPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col items-center justify-center p-6 text-center">
      
      {/* --- THE BROKEN HEART GIF --- */}
      <div className="mb-8 w-32 h-32 flex items-center justify-center overflow-hidden rounded-full">
        <img 
          src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndzB4bmZ6bmZ6bmZ6bmZ6bmZ6bmZ6bmZ6bmZ6bmZ6bmZ6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKVUn7iM8FMEU24/giphy.gif" 
          alt="Restricted Access"
          className="w-full h-full object-contain opacity-80"
        />
      </div>

      <h1 className="text-[28px] font-black uppercase italic tracking-tighter mb-4 text-gray-900">
        💋 Access Restricted
      </h1>
      
      <div className="w-16 h-[3px] bg-primary mb-8"></div>
      
      <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest max-w-xs leading-relaxed">
        Sy Exclusives is currently only available to users within the United States. 
      </p>
    </div>
  );
}