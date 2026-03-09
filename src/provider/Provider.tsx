import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { GoeyToaster } from "@/components/ui/goey-toaster";

interface ProviderProps {
  children: React.ReactNode;
}

function Provider({ children }: ProviderProps) {
  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <GoeyToaster />
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </>
  );
}

export default Provider;
