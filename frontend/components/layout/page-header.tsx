interface PageHeaderProps {
  title: string
}

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <h2 className="relative px-6 py-6 text-center rounded-xl w-[85%] mb-3 text-2xl font-bold text-white overflow-hidden backdrop-blur-sm shadow-lg">
      {/* Hintergrund mit Gradient und Glaseffekt */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-blue-500/90 -z-10"></div>

      {/* Subtile Designelemente */}
      <div className="absolute -top-6 -right-6 w-20 h-20 bg-blue-400/30 rounded-full blur-xl"></div>
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-blue-300/20 rounded-full blur-xl"></div>

      {/* Feiner Akzentstreifen am unteren Rand */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-300/60 to-white/60"></div>

      {/* Titel mit Icon */}
      <div className="flex items-center justify-center space-x-2">
        <span className="relative">{title}</span>
      </div>
    </h2>
  )
}

