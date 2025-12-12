import ClientForm from "../components/ClientForm";
import "../globals.css";

export default function Page() {
  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 12 }}>
        <ClientForm />

        <div className="small" style={{ marginTop: 16 }}>
          Form posts to:{" "}
          <code>
            {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/submit
          </code>
        </div>
      </div>
    </div>
  );
}
