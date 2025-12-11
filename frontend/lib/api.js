export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function submitForm(payload){
  const res = await fetch(`${API_URL}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.message || 'Request failed');
  return json;
}
