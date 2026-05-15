'use client';
import Link from 'next/link';
import { Shield, Users, Globe, TrendingUp, Award, CheckCircle } from 'lucide-react';

const STATS = [
  { v: '$2.4B+', l: 'Assets Under Management' },
  { v: '850K+',  l: 'Active Members'           },
  { v: '180+',   l: 'Countries Served'         },
  { v: '2021',   l: 'Founded'                  },
];

const VALUES = [
  { Icon: Shield,    color: '#f59e0b', title: 'Security First',     desc: 'Bank-grade encryption and multi-layer fraud monitoring protect every account, every transaction, every second.' },
  { Icon: Globe,     color: '#60a5fa', title: 'Global Access',      desc: 'From local transfers to international wires, we make global banking simple and affordable for everyone.'        },
  { Icon: TrendingUp,color: '#34d399', title: 'Financial Growth',   desc: 'Beyond banking — investments, credit building, and smart lending tools to help your wealth grow.'               },
  { Icon: Users,     color: '#a78bfa', title: 'People First',       desc: 'Built for real people. No jargon, no hidden fees, no surprises. Just honest, transparent banking.'              },
];

const TEAM = [
  { name: 'Marcus Webb',    role: 'Chief Executive Officer',        av: 'MW' },
  { name: 'Priya Nakamura', role: 'Chief Technology Officer',       av: 'PN' },
  { name: 'Jordan Ellis',   role: 'Chief Financial Officer',        av: 'JE' },
  { name: 'Sofia Reyes',    role: 'Chief Security Officer',         av: 'SR' },
  { name: 'Daniel Kim',     role: 'Head of Product',                av: 'DK' },
  { name: 'Amara Osei',     role: 'Head of Compliance',             av: 'AO' },
];

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#050d1a', color: '#e2e8f0', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px clamp(16px,5vw,64px)', borderBottom: '1px solid rgba(255,255,255,.06)', position: 'sticky', top: 0, background: 'rgba(5,13,26,.95)', backdropFilter: 'blur(20px)', zIndex: 50 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: '#050d1a' }}>N</div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>NexaBank</span>
        </Link>
        <Link href="/register" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#050d1a', padding: '9px 20px', borderRadius: 9, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
          Open Account
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: 'clamp(60px,10vw,120px) clamp(16px,5vw,64px) clamp(40px,6vw,80px)', maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', color: '#f59e0b', fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 100, letterSpacing: '.08em', marginBottom: 28 }}>
          <Award size={12} /> ABOUT NEXABANK
        </div>
        <h1 style={{ fontSize: 'clamp(32px,6vw,64px)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 24 }}>
          Banking Built for{' '}
          <span style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Real People
          </span>
        </h1>
        <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: 'rgba(255,255,255,.58)', lineHeight: 1.75, maxWidth: 600, margin: '0 auto' }}>
          NexaBank was founded with a single mission: make powerful financial tools accessible to everyone — not just the wealthy. We're a digital-first bank that combines enterprise-grade security with an experience anyone can use.
        </p>
      </section>

      {/* Stats */}
      <section style={{ padding: '0 clamp(16px,5vw,64px) clamp(40px,6vw,80px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 16 }}>
          {STATS.map(s => (
            <div key={s.l} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 900, color: '#f59e0b', letterSpacing: '-1.5px', marginBottom: 6 }}>{s.v}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section style={{ padding: 'clamp(40px,6vw,80px) clamp(16px,5vw,64px)', background: 'rgba(10,35,66,.35)', borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 16 }}>OUR MISSION</div>
            <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 20 }}>
              Democratising Access to Financial Power
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.55)', lineHeight: 1.75, marginBottom: 20 }}>
              For decades, sophisticated financial tools — investments, international transfers, credit building — were reserved for the privileged few. We believe every person deserves a fair shot at financial security and growth.
            </p>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.55)', lineHeight: 1.75 }}>
              NexaBank brings together everything you need to manage, grow, and protect your money in one place — with no hidden fees and no minimums.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['FDIC Insured up to $250,000','No monthly maintenance fees','No minimum balance requirements','Commission-free stock investing','Free intrabank transfers','24/7 fraud monitoring'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '12px 16px' }}>
                <CheckCircle size={15} color="#34d399" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,.72)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: 'clamp(40px,6vw,80px) clamp(16px,5vw,64px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12 }}>OUR VALUES</div>
            <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>What We Stand For</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 18 }}>
            {VALUES.map(v => (
              <div key={v.title} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '24px 22px' }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: `${v.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <v.Icon size={20} color={v.color} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{v.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', lineHeight: 1.7 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: 'clamp(40px,6vw,80px) clamp(16px,5vw,64px)', background: 'rgba(10,35,66,.3)', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12 }}>LEADERSHIP</div>
            <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>The Team Behind NexaBank</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16 }}>
            {TEAM.map(m => (
              <div key={m.name} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '24px 20px', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#050d1a', margin: '0 auto 14px' }}>{m.av}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer note */}
      <div style={{ padding: '24px clamp(16px,5vw,64px)', borderTop: '1px solid rgba(255,255,255,.06)', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.25)' }}>
        © {new Date().getFullYear()} NexaBank, N.A. · Member FDIC · Equal Housing Lender · Deposits insured to $250,000
      </div>
    </div>
  );
}