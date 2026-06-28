// =====================================================
// Digital Music Romania
// animations.js
// =====================================================

// =====================================================
// SCROLL REVEAL
// =====================================================

export function initAnimations() {

    const elements = document.querySelectorAll(
        ".hero-showcase, .latest-content, .about-content, .stat, .carousel-card, .registry-card"
    );

    const observer = new IntersectionObserver((entries) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("show");

            }

        });

    }, {

        threshold: 0.15

    });

    elements.forEach(el => {

        el.classList.add("fade");
        observer.observe(el);

    });

}

// =====================================================
// HERO PARALLAX
// =====================================================

export function initHeroParallax() {

    const hero = document.querySelector(".hero-showcase");

    if (!hero) return;

    window.addEventListener("mousemove", (e) => {

        const x = (e.clientX / window.innerWidth - 0.5) * 8;
        const y = (e.clientY / window.innerHeight - 0.5) * 8;

        hero.style.transform =
            `translate(${x}px, ${y}px)`;

    });

}

// =====================================================
// AUTO HIDE HEADER
// =====================================================

export function autoHideHeader() {

    const navbar = document.querySelector(".navbar");

    if (!navbar) return;

    let lastScroll = 0;

    window.addEventListener("scroll", () => {

        const current = window.pageYOffset;

        if (current > lastScroll && current > 120) {

            navbar.style.transform = "translateY(-100%)";

        } else {

            navbar.style.transform = "translateY(0)";

        }

        lastScroll = current;

    });

}

// =====================================================
// RIPPLE BUTTONS
// =====================================================

export function rippleButtons() {

    const buttons = document.querySelectorAll(
        ".btn-primary, .btn-secondary"
    );

    buttons.forEach(button => {

        button.addEventListener("click", function (e) {

            const ripple = document.createElement("span");

            ripple.style.position = "absolute";
            ripple.style.borderRadius = "50%";
            ripple.style.background = "rgba(255,255,255,.35)";
            ripple.style.width = "12px";
            ripple.style.height = "12px";
            ripple.style.pointerEvents = "none";

            const rect = this.getBoundingClientRect();

            ripple.style.left =
                (e.clientX - rect.left - 6) + "px";

            ripple.style.top =
                (e.clientY - rect.top - 6) + "px";

            ripple.animate([
                {
                    transform: "scale(1)",
                    opacity: 0.8
                },
                {
                    transform: "scale(18)",
                    opacity: 0
                }
            ], {
                duration: 600
            });

            this.appendChild(ripple);

            setTimeout(() => {

                ripple.remove();

            }, 600);

        });

        button.style.position = "relative";
        button.style.overflow = "hidden";

    });

}

// =====================================================
// VERIFIED GLOW
// =====================================================

export function glowVerified() {

    const verified = document.querySelectorAll(
        ".registry-status, .showcase-status"
    );

    verified.forEach(el => {

        setInterval(() => {

            el.animate([
                {
                    boxShadow: "0 0 0 rgba(24,180,91,0)"
                },
                {
                    boxShadow: "0 0 18px rgba(24,180,91,.8)"
                },
                {
                    boxShadow: "0 0 0 rgba(24,180,91,0)"
                }
            ], {
                duration: 2200
            });

        }, 2500);

    });

}