export default function Footer() {
  return (
    <footer className="bg-morado-dark text-white mt-auto py-6">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 bg-dorado rounded-full flex items-center justify-center">
            <span className="text-morado font-extrabold text-xs">MMT</span>
          </div>
          <span className="font-semibold text-sm">Misioneros en el Mundo del Trabajo</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-purple-300">
          <a href="https://www.misionerosmt.org" target="_blank" rel="noopener noreferrer" className="hover:text-dorado transition-colors">
            www.misionerosmt.org
          </a>
          <span className="hidden sm:inline">·</span>
          <a href="mailto:info@misionerosmt.org" className="hover:text-dorado transition-colors">
            info@misionerosmt.org
          </a>
        </div>
        <p className="text-xs text-purple-400 mt-3">
          Programa Sembrando Valores — Pastoral Social © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
