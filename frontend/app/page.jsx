// frontend/app/page.jsx
import "../globals.css";
import ClientForm from "../components/ClientForm";

export default function Page() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Astro Playlist — Submit</h1>
      <ClientForm />
    </main>
  );
}
