import "./globals.css";         // <-- change here
"use client";
import dynamic from "next/dynamic";

const Form = dynamic(() => import("../components/Form"), { ssr:false });

export default function Page(){
  return (
    <div className="container">
      <div style={{marginBottom:12}} className="card">
        <Form initialLang="en" />
        <div className="small" style={{marginTop:16}}>
          Form posts to: <code>{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/submit</code>
        </div>
      </div>
    </div>
  );
}
