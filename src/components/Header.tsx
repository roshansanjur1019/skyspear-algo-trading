import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  user?: any;
  onLogin: () => void;
  onLogout: () => void;
}

const Header = ({ user, onLogin, onLogout }: HeaderProps) => {
  const navigate = useNavigate();

  const handleDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Skyspear
            </span>
          </h1>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => navigate("/features")} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Features
            </button>
            <button onClick={() => navigate("/pricing")} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Pricing
            </button>
            <button onClick={() => navigate("/about")} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              About
            </button>
          </nav>
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 hover:bg-primary/10">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary border border-primary/30">
                      {user.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-xl border-border/50">
                <DropdownMenuItem onClick={handleDashboard} className="cursor-pointer">
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive cursor-pointer">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={onLogin} className="hover:bg-primary/10 hover:text-primary">
                Login
              </Button>
              <GradientButton onClick={onLogin} className="px-6 py-3">
                Get Started
              </GradientButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
