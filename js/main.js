/**
 * Flight Agent - Interactivity Script
 */

document.addEventListener('DOMContentLoaded', () => {
    // Header transition on scroll
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Reveal animations on scroll
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => revealObserver.observe(el));

    // Copy to clipboard functionality
    window.copyToClipboard = (id) => {
        const codeElement = document.getElementById(id);
        const text = codeElement.innerText;
        
        navigator.clipboard.writeText(text).then(() => {
            const btn = codeElement.parentElement.querySelector('.copy-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span>Copied!</span>';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    };
});
