/* Fonts are self-hosted (no Google Fonts request): faster, and no visitor data sent to Google */
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/permanent-marker';
import '@fontsource/rubik-spray-paint';
import '../gallery.css';
import '../site.css';
export default function SiteLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
