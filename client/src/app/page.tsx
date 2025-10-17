import { NavBar } from "@/components/navbar";
import Landing from "@/app/(nondashboard)/landing/page";

export default function Home() {
  return (
    <div className="h-full w-full">
      <NavBar />
      <main className={`h-full flex w-full flex-col`}>
        <Landing />
      </main>
    </div>
  );
}
