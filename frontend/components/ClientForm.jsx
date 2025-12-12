"use client";

import dynamic from "next/dynamic";

const Form = dynamic(() => import("./Form"), { ssr: false });

export default function ClientForm() {
  return <Form />;
}
