/* Fonts are self-hosted (no Google Fonts request): faster, and no visitor data sent to Google */
import '@fontsource-variable/montserrat';
import '@fontsource-variable/unbounded';
import '@fontsource/permanent-marker';
import '@fontsource/rubik-spray-paint';
/* hand styles for the influences ceiling */
import '@fontsource/rock-salt';
import '@fontsource/sedgwick-ave-display';
import '@fontsource/knewave';
import '@fontsource/caveat-brush';
import '@fontsource/nanum-pen-script';
import '../gallery.css';
import '../site.css';
import ContactDialog from '@/components/ContactDialog';
export default function SiteLayout({ children }: { children: React.ReactNode }) { return <>{children}<ContactDialog /></>; }
