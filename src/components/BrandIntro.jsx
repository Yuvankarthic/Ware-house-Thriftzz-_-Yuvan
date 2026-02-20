import React, { useEffect, useRef, useState } from 'react';
import '../styles/BrandIntro.css';

const lines = [
    { tag: "01", text: "We don't do trends." },
    { tag: "02", text: "Trends expire. We don't." },
    { tag: "03", text: "Built for people who are tired of looking like everyone else." },
];

const badges = ["NO LOGO FLEX", "JUST VIBES", "WEAR IT, OWN IT", "NOT FOR EVERYONE"];

const BrandIntro = () => {
    const sectionRef = useRef(null);
    const [visible, setVisible] = useState(false);
    const [activeBadge, setActiveBadge] = useState(0);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.25 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveBadge((prev) => (prev + 1) % badges.length);
        }, 1800);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="brand-intro-section">
            <div className="brand-intro" ref={sectionRef}>
                {/* Top label */}
                <div className={`brand-intro__label ${visible ? 'bi-visible' : ''}`}>
                    ✦ About WHT
                </div>

                {/* Hero statement */}
                <div className={`brand-intro__hero ${visible ? 'bi-visible' : ''}`}>
                    <span className="brand-intro__hero-small">We are</span>
                    <h2 className="brand-intro__hero-title">
                        WHT<span className="brand-intro__dot">.</span>
                    </h2>
                    <p className="brand-intro__hero-sub">
                        (That's it. That's the whole name.) 😐
                    </p>
                </div>

                {/* Attitude lines */}
                <div className="brand-intro__lines">
                    {lines.map((line, i) => (
                        <div
                            key={i}
                            className={`brand-intro__line ${visible ? 'bi-visible' : ''}`}
                            style={{ transitionDelay: `${0.2 + i * 0.15}s` }}
                        >
                            <span className="brand-intro__line-tag">{line.tag}</span>
                            <p className="brand-intro__line-text">{line.text}</p>
                        </div>
                    ))}
                </div>

                {/* Info column */}
                <div className={`brand-intro__body ${visible ? 'bi-visible' : ''}`} style={{ transitionDelay: '0.65s' }}>
                    <div className="brand-intro__col">
                        <span className="brand-intro__col-label">Founded</span>
                        <span className="brand-intro__col-value">Because someone had to.</span>
                    </div>
                    <div className="brand-intro__col">
                        <span className="brand-intro__col-label">Based In</span>
                        <span className="brand-intro__col-value">Your city. Hopefully.</span>
                    </div>
                    <div className="brand-intro__col">
                        <span className="brand-intro__col-label">Vibe</span>
                        <span className="brand-intro__col-value">Quiet. Sharp. Unbothered.</span>
                    </div>
                    <div className="brand-intro__col">
                        <span className="brand-intro__col-label">Mood</span>
                        <span className="brand-intro__col-value">Choose the silhouette. Drop the noise.</span>
                    </div>
                </div>

                {/* Rotating badge */}
                <div className={`brand-intro__badge-wrap ${visible ? 'bi-visible' : ''}`} style={{ transitionDelay: '0.8s' }}>
                    {badges.map((b, i) => (
                        <span
                            key={i}
                            className={`brand-intro__badge ${i === activeBadge ? 'brand-intro__badge--active' : ''}`}
                        >
                            {b}
                        </span>
                    ))}
                </div>

                {/* Closing kicker */}
                <div className={`brand-intro__kicker ${visible ? 'bi-visible' : ''}`} style={{ transitionDelay: '0.95s' }}>
                    <span>If you get it,</span>
                    <strong> you get it. 🖤</strong>
                </div>
            </div>
        </section>
    );
};

export default BrandIntro;
