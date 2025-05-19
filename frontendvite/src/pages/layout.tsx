import type React from "react"


// Using standard CSS for Inter font instead of Next.js font loader
// Add this to your globals.css or create a separate CSS file for fonts
// @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  return (
      <div className="flex justify-center bg-gray-100">
        <div className="max-w-md w-full bg-[#EAEFF5] min-h-screen overflow-hidden relative font-inter">

            <div className="app-container w-full h-full">
                {children}
            </div>

        </div>
      </div>
  )
}
