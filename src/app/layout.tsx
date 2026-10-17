import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:{default:"Samen Learning | Learn, read and grow",template:"%s | Samen Learning"},description:"A welcoming multilingual learning platform and digital library."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
