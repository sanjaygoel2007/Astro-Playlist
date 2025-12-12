import ClientForm from "../components/ClientForm";
import "../globals.css";

export default function Page() {
  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 12 }}>
        <ClientForm />
      </div>
    </div>
  );
}
