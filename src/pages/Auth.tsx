import AuthForm from "@/components/AuthForm";

const Auth = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mb-2">
            Skyspear
          </h1>
          <p className="text-muted-foreground">Welcome to automated trading</p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
};

export default Auth;
