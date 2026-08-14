import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeftRight,
  CalendarDays,
  MessageCircle,
  Sparkles,
  Star,
  Award,
  Play,
  ChevronRight,
  Code2,
  Link2,
  Share2,
  CheckCircle2,
  Zap,
} from 'lucide-react'

/* ── Animation variants ──────────────────────────────────── */
const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } },
}
const stagger = { visible: { transition: { staggerChildren: 0.1 } } }

/* ── Floating hero card component ───────────────────────── */
const HeroCard = ({ style, className, children }) => (
  <div
    className={`card-glass rounded-2xl p-4 ${className}`}
    style={{ boxShadow: '0 8px 32px rgba(91,79,232,0.15)', ...style }}
  >
    {children}
  </div>
)

/* ── Star rating row ─────────────────────────────────────── */
const StarRow = ({ count = 5 }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <Star key={i} size={13} fill="#F59E0B" color="#F59E0B" aria-hidden="true" />
    ))}
  </div>
)

/* ══════════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════════ */
const LandingPage = () => {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', overflowX: 'hidden' }}>

      {/* ── SECTION 1: HERO ───────────────────────────────── */}
      <section
        id="hero"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #EEF2FF 0%, var(--bg) 70%)',
          padding: '80px 24px 60px',
          textAlign: 'center',
        }}
      >
        {/* Background blobs */}
        <div
          className="animate-blob"
          style={{
            position: 'absolute', top: '10%', left: '5%', width: 320, height: 320,
            borderRadius: '50%', background: 'rgba(91,79,232,0.06)', filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />
        <div
          className="animate-blob-delayed"
          style={{
            position: 'absolute', bottom: '10%', right: '5%', width: 280, height: 280,
            borderRadius: '50%', background: 'rgba(236,72,153,0.06)', filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          style={{ maxWidth: 680, position: 'relative', zIndex: 1 }}
        >
          {/* Announcement pill */}
          <motion.div variants={fadeUp} style={{ marginBottom: 24, display: 'inline-block' }}>
            <a
              href="#features"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 14px',
                borderRadius: 9999,
                border: '1px solid var(--border-strong)',
                background: 'var(--accent-dim)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--accent)',
                textDecoration: 'none',
                transition: 'all 150ms',
              }}
            >
              <Sparkles size={12} aria-hidden="true" />
              ✦ Skill exchange, gigs, and real-time sessions
              <ChevronRight size={12} aria-hidden="true" />
            </a>
          </motion.div>

          {/* H1 */}
          <motion.h1
            variants={fadeUp}
            className="text-hero"
            style={{ margin: '0 0 20px', color: 'var(--text)' }}
          >
            <span className="gradient-text">Exchange Skills.</span>
            <br />Grow Together.
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeUp}
            style={{
              fontSize: 18, lineHeight: 1.7, color: 'var(--text-muted)',
              maxWidth: 520, margin: '0 auto 36px',
            }}
          >
            SkillX connects you with people who have what you need — and need what you have.
            No money. Just skills.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}
          >
            <Link
              to="/signup"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15,
                background: 'var(--accent)', color: '#fff',
                textDecoration: 'none', boxShadow: '0 4px 14px rgba(91,79,232,0.4)',
                transition: 'all 200ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-hover)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Get Started Free
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
            <a
              href="#how-it-works"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', borderRadius: 10, fontWeight: 600, fontSize: 15,
                background: 'transparent', color: 'var(--text-muted)',
                border: '1.5px solid var(--border)', textDecoration: 'none',
                transition: 'all 200ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
            >
              <Play size={15} aria-hidden="true" />
              See How It Works
            </a>
          </motion.div>


        </motion.div>

        {/* Floating cards mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'relative', marginTop: 60, width: '100%', maxWidth: 560,
            height: 220, zIndex: 1,
          }}
          aria-hidden="true"
        >
          <HeroCard
            className="animate-float-slow absolute left-0 bottom-0"
            style={{ width: 220, zIndex: 1 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 16 }}>👩‍💻</span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Priya S.</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Offers: React</div>
              </div>
            </div>
            <div className="badge badge-exchange">Wants: UI Design</div>
          </HeroCard>

          <HeroCard
            className="animate-float absolute left-1/2 -translate-x-1/2 top-0"
            style={{ width: 240, zIndex: 3 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <ArrowLeftRight size={18} color="var(--accent)" aria-hidden="true" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>Match Found!</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
              <span>React ↔ UI Design</span>
              <CheckCircle2 size={14} color="var(--green)" aria-hidden="true" />
            </div>
            <div style={{ marginTop: 8, height: 3, borderRadius: 9999, background: 'var(--border)' }}>
              <div style={{ width: '80%', height: '100%', borderRadius: 9999, background: 'var(--accent)' }} />
            </div>
          </HeroCard>

          <HeroCard
            className="animate-float-delayed absolute right-0 bottom-0"
            style={{ width: 220, zIndex: 1 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 16 }}>🎨</span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Arjun M.</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Offers: Design</div>
              </div>
            </div>
            <div className="badge badge-active">Wants: React</div>
          </HeroCard>
        </motion.div>
      </section>

      {/* ── SECTION 2: HOW IT WORKS ───────────────────────── */}
      <section
        id="how-it-works"
        style={{ padding: '96px 24px', background: 'var(--surface)', textAlign: 'center' }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.p
              variants={fadeUp}
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}
            >
              How It Works
            </motion.p>
            <motion.h2
              variants={fadeUp}
              style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 64, color: 'var(--text)' }}
            >
              Exchange skills in 3 simple steps
            </motion.h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, position: 'relative' }}>
              {/* Connector line */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute', top: 28, left: 'calc(16.67% + 20px)', right: 'calc(16.67% + 20px)',
                  height: 2, borderTop: '2px dashed var(--border-strong)',
                }}
              />

              {[
                { num: '01', Icon: Zap, title: 'Post Your Skill', desc: 'Tell the community what you can offer and what you want to learn.' },
                { num: '02', Icon: ArrowLeftRight, title: 'Find Your Match', desc: 'Our AI finds people who need what you offer and offer what you need.' },
                { num: '03', Icon: CalendarDays, title: 'Start Exchanging', desc: 'Schedule sessions, chat, video call, and grow together — for free.' },
              ].map(({ num, Icon, title, desc }, i) => (
                <motion.div key={i} variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: 'var(--accent)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, fontWeight: 700, position: 'relative', zIndex: 1,
                    }}
                  >
                    {num}
                  </div>
                  <Icon size={32} color="var(--accent)" aria-hidden="true" />
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>{title}</h3>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 3: FEATURES ───────────────────────────── */}
      <section
        id="features"
        style={{ padding: '96px 24px', background: 'var(--bg)', textAlign: 'center' }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.p variants={fadeUp} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>
              Features
            </motion.p>
            <motion.h2 variants={fadeUp} style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 64, color: 'var(--text)' }}>
              Everything you need to grow
            </motion.h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[
                { Icon: ArrowLeftRight, title: 'Skill Exchange Matching', desc: 'Smart matching finds the perfect exchange partner for your exact needs.', color: '#5B4FE8', bg: '#EEF2FF' },
                { Icon: CalendarDays,   title: 'Schedule Sessions',      desc: 'Book and manage learning sessions with built-in scheduling.',           color: '#0EA5E9', bg: '#E0F2FE' },
                { Icon: MessageCircle,  title: 'Real-time Chat',         desc: 'Communicate instantly with your exchange partners via live chat.',       color: '#10B981', bg: '#ECFDF5' },
                { Icon: Sparkles,       title: 'AI Gig Suggestions',     desc: 'AI-powered recommendations for gigs tailored to your skill set.',       color: '#EC4899', bg: '#FDF2F8' },
                { Icon: Star,           title: 'Ratings & Reviews',      desc: 'Build your reputation with authentic ratings after every session.',     color: '#F59E0B', bg: '#FFFBEB' },
                { Icon: Award,          title: 'Achievement Badges',     desc: 'Earn recognition badges as you complete more skill exchanges.',          color: '#14B8A6', bg: '#F0FDFA' },
              ].map(({ Icon, title, desc, color, bg }, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="card card-spring"
                  style={{ textAlign: 'left', cursor: 'default' }}
                  whileHover={{ y: -4, scale: 1.01 }}
                >
                  <div
                    style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 16,
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={24} color={color} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>{title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-muted)' }}>{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>



      {/* ── SECTION 5: TESTIMONIALS ───────────────────────── */}
      <section
        id="testimonials"
        style={{ padding: '96px 24px', background: 'var(--surface)' }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.p variants={fadeUp} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>
              Testimonials
            </motion.p>
            <motion.h2 variants={fadeUp} style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 48, color: 'var(--text)' }}>
              What learners are saying
            </motion.h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[
                {
                  name: 'V. R.', role: 'Computer Science Student',
                  quote: 'I posted a React listing and got a reply the same day. We set up a session, I helped with frontend basics, and they walked me through Photoshop. Exactly what I needed.',
                  initials: 'VR', stars: 5,
                },
                {
                  name: 'K. S.', role: 'Freelance Illustrator',
                  quote: "I'm not a dev at all, but I managed to swap my illustration skills for help building a portfolio site. The chat and scheduling made it surprisingly easy to coordinate.",
                  initials: 'KS', stars: 5,
                },
                {
                  name: 'A. T.', role: 'Self-taught Developer',
                  quote: 'Posted a gig, got a few responses, picked someone with good reviews. Clean process. No money changed hands — just two people helping each other out.',
                  initials: 'AT', stars: 4,
                },
              ].map(({ name, role, quote, initials, stars }, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="card card-hover"
                  style={{ textAlign: 'left' }}
                >
                  <StarRow count={stars} />
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-muted)', margin: '14px 0 20px', fontStyle: 'italic' }}>
                    "{quote}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'var(--accent-dim)', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 13, flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 6: CTA BANNER ─────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, #7C3AED 100%)',
              borderRadius: 24, padding: '64px 48px', textAlign: 'center',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Animated blobs */}
            <div
              className="animate-blob"
              aria-hidden="true"
              style={{
                position: 'absolute', top: '-30%', right: '-10%', width: 300, height: 300,
                borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(30px)',
                pointerEvents: 'none',
              }}
            />
            <div
              className="animate-blob-delayed"
              aria-hidden="true"
              style={{
                position: 'absolute', bottom: '-20%', left: '-5%', width: 250, height: 250,
                borderRadius: '50%', background: 'rgba(236,72,153,0.2)', filter: 'blur(40px)',
                pointerEvents: 'none',
              }}
            />

            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 16, position: 'relative' }}>
              Ready to start exchanging?
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 32, position: 'relative' }}>
              Join thousands of learners sharing knowledge — completely free.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
              <Link
                to="/signup"
                style={{
                  padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15,
                  background: '#fff', color: 'var(--accent)', textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  transition: 'all 200ms',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)' }}
              >
                Get Started Free
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
              <Link
                to="/gig-list"
                style={{
                  padding: '12px 28px', borderRadius: 10, fontWeight: 600, fontSize: 15,
                  background: 'rgba(255,255,255,0.15)', color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
                  transition: 'all 200ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
              >
                View Gigs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          padding: '48px 24px 24px',
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 48, marginBottom: 40 }}>
            {/* Brand */}
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)', marginBottom: 10 }}>
                Skill<span className="gradient-text">X</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-muted)', maxWidth: 280 }}>
                A platform to exchange skills, post gigs, and grow together — completely free.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                {[
                                  { Icon: Code2,  label: 'GitHub',   href: 'https://github.com/rai0vishal/SKillX' },
                  { Icon: Link2,  label: 'LinkedIn', href: '#' },
                  { Icon: Share2, label: 'Twitter',  href: '#' },
                ].map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    style={{
                      width: 34, height: 34, borderRadius: 8,
                      border: '1px solid var(--border)', background: 'var(--surface2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)', textDecoration: 'none',
                      transition: 'all 150ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--accent-dim)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface2)' }}
                  >
                    <Icon size={15} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16, letterSpacing: '0.01em' }}>Quick Links</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { to: '/dashboard',    label: 'Dashboard' },
                  { to: '/post-gig',     label: 'Post Gig' },
                  { to: '/gig-list',     label: 'Browse Gigs' },
                  { to: '/skill-exchange', label: 'Skill Exchange' },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 150ms' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16, letterSpacing: '0.01em' }}>Contact</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li style={{ fontSize: 14, color: 'var(--text-muted)' }}>support@skillx.com</li>
                <li style={{ fontSize: 14, color: 'var(--text-muted)' }}>+91 98765 43210</li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} SkillX. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
