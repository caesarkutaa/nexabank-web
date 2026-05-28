'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useSiteConfig } from '../../app/hooks/Usesiteconfig';

export default function ContactPage() {
  const { config } = useSiteConfig();
  const bankName = config?.bankName || 'NexaBank';
  const [form, setForm] = useState({ name:'', email:'', subject:'', message:'' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const upd = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSent(true); setSending(false);
  };

  const inp: React.CSSProperties = { width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.12)', borderRadius:10, padding:'12px 14px', fontSize:14, color:'#fff', outline:'none', fontFamily:'inherit', WebkitTextFillColor:'#fff', boxSizing:'border-box', transition:'border-color .2s' };

  return (
    <div style={{ minHeight:'100vh', background:'#060810', color:'#e2e8f0', fontFamily:"'Inter',system-ui,sans-serif" }}>
      <nav style={{ position:'sticky', top:0, zIndex:50, background:'rgba(6,8,16,.94)', backdropFilter:'blur(24px)', borderBottom:'1px solid rgba(245,158,11,.1)', padding:'14px 32px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#f59e0b,#d97706)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:900, color:'#060810' }}>{bankName[0]}</div>
          <span style={{ fontSize:18, fontWeight:800, color:'#fff' }}>{bankName}</span>
        </Link>
        <Link href="/register" style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#060810', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:700, textDecoration:'none' }}>Open Account</Link>
      </nav>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:'64px 32px' }}>
        <div style={{ textAlign:'center', marginBottom:60 }}>
          <div style={{ fontSize:12, color:'#f59e0b', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>Get in Touch</div>
          <h1 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, color:'#fff', letterSpacing:'-1.5px', marginBottom:14 }}>We're Here to Help</h1>
          <p style={{ fontSize:15, color:'rgba(255,255,255,.45)', fontWeight:300 }}>Our support team typically responds within 2 hours during business hours.</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:40 }}>
          {/* Contact info */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {[
              { Icon:Mail,    color:'#f59e0b', label:'Email Support',   val:`support@${bankName.toLowerCase()}.com`,  sub:'Mon–Fri, 9am–6pm ET' },
              { Icon:Phone,   color:'#60a5fa', label:'Phone',            val:'1-800-NEXABANK',                         sub:'24/7 for account emergencies' },
              { Icon:MapPin,  color:'#34d399', label:'Headquarters',     val:'1 Financial Plaza',                      sub:'New York, NY 10005' },
              { Icon:Clock,   color:'#a78bfa', label:'Support Hours',    val:'Mon–Fri 8am–8pm ET',                    sub:'Sat 9am–5pm ET' },
            ].map(({ Icon, color, label, val, sub }) => (
              <div key={label} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:14, padding:'18px 20px', display:'flex', alignItems:'flex-start', gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={18} color={color}/>
                </div>
                <div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:4 }}>{label}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:2 }}>{val}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,.35)', fontWeight:300 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:18, padding:32 }}>
            {sent ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, padding:'48px 0', textAlign:'center' }}>
                <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(52,211,153,.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <CheckCircle2 size={32} color="#34d399"/>
                </div>
                <h3 style={{ fontSize:20, fontWeight:700, color:'#fff', margin:0 }}>Message Sent!</h3>
                <p style={{ fontSize:14, color:'rgba(255,255,255,.45)', margin:0, fontWeight:300 }}>We'll get back to you within 2 hours.</p>
                <button onClick={()=>{setSent(false);setForm({name:'',email:'',subject:'',message:''}); }} style={{ background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.12)', borderRadius:10, padding:'10px 20px', fontSize:13, color:'rgba(255,255,255,.6)', cursor:'pointer', fontFamily:'inherit' }}>Send another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', margin:'0 0 8px' }}>Send a Message</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div><label style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:6 }}>Your Name *</label>
                    <input style={inp} value={form.name} onChange={upd('name')} placeholder="John Doe" required onFocus={e=>(e.target.style.borderColor='rgba(245,158,11,.5)')} onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,.12)')}/></div>
                  <div><label style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:6 }}>Email *</label>
                    <input style={inp} type="email" value={form.email} onChange={upd('email')} placeholder="john@example.com" required onFocus={e=>(e.target.style.borderColor='rgba(245,158,11,.5)')} onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,.12)')}/></div>
                </div>
                <div><label style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:6 }}>Subject</label>
                  <select style={{ ...inp, appearance:'none', cursor:'pointer' }} value={form.subject} onChange={upd('subject')} onFocus={e=>(e.target.style.borderColor='rgba(245,158,11,.5)')} onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,.12)')}>
                    <option value="">Select a topic…</option>
                    <option>Account Opening</option><option>Transaction Issue</option><option>Card Problem</option>
                    <option>Loan Inquiry</option><option>Security Concern</option><option>Technical Support</option><option>Other</option>
                  </select></div>
                <div><label style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:6 }}>Message *</label>
                  <textarea style={{ ...inp, resize:'vertical', lineHeight:1.6 }} rows={5} value={form.message} onChange={upd('message')} placeholder="Describe your issue or question in detail…" required onFocus={e=>(e.target.style.borderColor='rgba(245,158,11,.5)')} onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,.12)')}/></div>
                <button type="submit" disabled={sending} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#060810', border:'none', borderRadius:12, padding:'13px', fontSize:14, fontWeight:700, cursor:sending?'not-allowed':'pointer', fontFamily:'inherit', opacity:sending?.7:1 }}>
                  {sending?<><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> Sending…</>:'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <footer style={{ borderTop:'1px solid rgba(255,255,255,.05)', padding:'24px 32px', textAlign:'center', fontSize:12, color:'rgba(255,255,255,.2)', fontWeight:300 }}>
        {bankName}, N.A. · Member FDIC · © {new Date().getFullYear()}
        <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      </footer>
    </div>
  );
}