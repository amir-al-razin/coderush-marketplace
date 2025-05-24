export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8">
      <h1 className="text-3xl font-bold">Welcome to Coderush Marketplace</h1>
      <div className="flex gap-4 mt-6">
        <a href="/register">
          <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium shadow hover:bg-primary/90 transition-colors">
            Register
          </button>
        </a>
        <a href="/login">
          <button className="bg-secondary text-secondary-foreground px-6 py-2 rounded-md font-medium shadow hover:bg-secondary/80 transition-colors">
            Login
          </button>
        </a>
      </div>
    </div>
  );
}
