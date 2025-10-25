import Navbar from "~/components/Navbar";

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar showUserMenu={false} />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}