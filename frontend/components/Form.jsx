"use client";
import { useState, useEffect } from "react";
import { submitForm } from "../lib/api";

const TRANSLATIONS = {
  en: {
    title: "Astrology — Submit Birth Details",
    name: "Name",
    dob: "Date of birth",
    tob: "Time of birth",
    place: "Place",
    problem: "Problem / Query",
    mobile: "Mobile number",
    language: "Preferred language",
    submit: "Submit",
    success: "Submitted successfully. We'll process and contact you.",
    required: "Please fill required fields",
    submitting: "Submitting..."
  },
  hi: {
    title: "जन्म विवरण जमा करें",
    name: "नाम",
    dob: "जन्मतिथि",
    tob: "जन्म समय",
    place: "जगह",
    problem: "समस्या / प्रश्न",
    mobile: "मोबाइल नंबर",
    language: "भाषा चुनें",
    submit: "जमा करें",
    success: "सफलतापूर्वक जमा हुआ। हम संपर्क करेंगे।",
    required: "कृपया आवश्यक फ़ील्ड भरें",
    submitting: "जमा कर रहे हैं..."
  }
};

export default function Form({ initialLang = "en" }){
  const [lang, setLang] = useState(initialLang);
  const t = TRANSLATIONS[lang];
  const [form, setForm] = useState({
    name:"", dob:"", tob:"", place:"", problem:"", mobile:"", language: lang
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(()=>{
    const stored = typeof window !== "undefined" && window.localStorage.getItem('preferred_lang');
    if (stored && TRANSLATIONS[stored]) {
      setLang(stored);
      setForm(f => ({...f, language: stored}));
    }
  },[]);

  function onChange(e){
    const { name, value } = e.target;
    setForm(prev => ({...prev, [name]: value}));
  }

  async function onSubmit(e){
    e.preventDefault();
    setMsg(null);
    if (!form.name || !form.dob || !form.tob) {
      setMsg({ type:"error", text: t.required });
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, language: lang };
      const r = await submitForm(payload);
      setMsg({ type:"success", text: t.success });
      setForm({ name:"", dob:"", tob:"", place:"", problem:"", mobile:"", language: lang });
      window.localStorage.setItem('preferred_lang', lang);
    } catch (err){
      setMsg({ type:"error", text: err.message || "Error" });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <h1>{t.title}</h1>
        <div className="lang-select">
          <select value={lang} onChange={e => { setLang(e.target.value); setForm(f=>({...f, language:e.target.value})); }}>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>
      </div>

      <form onSubmit={onSubmit} style={{marginTop:8}}>
        <label>{t.name}</label>
        <input name="name" value={form.name} onChange={onChange} placeholder={t.name} />

        <div className="row" style={{marginTop:6}}>
          <div className="col">
            <label>{t.dob}</label>
            <input type="date" name="dob" value={form.dob} onChange={onChange} />
          </div>
          <div className="col">
            <label>{t.tob}</label>
            <input type="time" name="tob" value={form.tob} onChange={onChange} />
          </div>
        </div>

        <label>{t.place}</label>
        <input name="place" value={form.place} onChange={onChange} placeholder={t.place} />

        <label>{t.problem}</label>
        <textarea name="problem" value={form.problem} onChange={onChange} placeholder={t.problem} />

        <label>{t.mobile}</label>
        <input name="mobile" value={form.mobile} onChange={onChange} placeholder={t.mobile} />

        <div style={{display:"flex", gap:10, alignItems:"center"}}>
          <button className="button" disabled={loading} type="submit">{loading ? t.submitting : t.submit}</button>
          <div className="small">We will store submission in the server DB.</div>
        </div>
      </form>

      {msg && <div className={`alert ${msg.type === "success" ? "success" : "error"}`}>{msg.text}</div>}
    </div>
  );
}
