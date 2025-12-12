// frontend/components/Form.jsx
"use client";

import { useState } from "react";

export default function Form() {
  const [name, setName] = useState("");
  return (
    <form onSubmit={(e)=>{e.preventDefault(); alert("Submitted: "+name)}}>
      <div>
        <label>Name</label><br/>
        <input value={name} onChange={(e)=>setName(e.target.value)} />
      </div>
      <button type="submit" style={{marginTop:8}}>Submit</button>
    </form>
  );
}
