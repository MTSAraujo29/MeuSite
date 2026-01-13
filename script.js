document.addEventListener('DOMContentLoaded', () => {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const sidebar = document.querySelector('.sidebar');
    const navLinks = document.querySelectorAll('.sidebar-nav a');

    // Toggle Sidebar
    mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');

        // Toggle Icon
        const icon = mobileToggle.querySelector('i');
        if (sidebar.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Close Sidebar when clicking a link (mobile)
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                const icon = mobileToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });

    // Active Link Highlight on Scroll
    const sections = document.querySelectorAll('section');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // Terminal Typewriter Effect
    const terminalText = document.getElementById('terminalText');
    const aboutSection = document.getElementById('sobre');
    let hasTyped = false;

    const textToType = [
        "Olá! Meu nome é Matheus e gosto de desenvolver e projetar ferramentas através da tecnologia. Meu interesse em desenvolvimento web começou quando decidi tentar editar temas personalizados — o que me ensinou muito sobre HTML & CSS!",
        "", // Empty string for paragraph break
        "Hoje, tive o privilégio de trabalhar em diversos projetos acadêmicos e pessoais. Meu foco principal atualmente é construir produtos acessíveis e inclusivos e experiências digitais para uma variedade de clientes.",
        "",
        "Como já mencionado anteriomente sempre estou em constante aprimoramento técnico, atualmente focado em Data Science. Trazendo para meu stack conhecimentos em desenvolvimento web e software e Data Science.",
        "",
        "Aqui estão algumas tecnologias com as quais tenho trabalhado recentemente em ranking:",
        "",
        "> 1° JavaScript (ES6+)",
        "> 2° Node.js (express.js)",
        "> 3° React.js",
        "> 4° Python",
        "> 5° Power BI",
        "> 6° R"
    ];

    function typeWriter(textArray, element) {
        let lineIndex = 0;
        let charIndex = 0;

        function typeLine() {
            if (lineIndex < textArray.length) {
                const currentLine = textArray[lineIndex];

                // Create a p element for the line if it doesn't exist yet for this line
                let p = element.children[lineIndex];
                if (!p) {
                    p = document.createElement('p');
                    p.style.margin = "0 0 5px 0";
                    p.style.minHeight = "20px";
                    if (currentLine.startsWith("> ")) {
                        p.style.color = "#38bdf8"; // Access accent color roughly
                        p.style.fontFamily = "monospace";
                    }
                    element.appendChild(p);
                }

                if (charIndex < currentLine.length) {
                    p.textContent += currentLine.charAt(charIndex);
                    charIndex++;
                    setTimeout(typeLine, 20); // Typing speed
                } else {
                    lineIndex++;
                    charIndex = 0;
                    setTimeout(typeLine, 100); // Delay between lines
                }
            } else {
                // Blink cursor at the end
                const cursor = document.createElement('span');
                cursor.className = 'cursor';
                element.appendChild(cursor);
            }
        }

        typeLine();
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasTyped) {
                hasTyped = true;
                typeWriter(textToType, terminalText);
            }
        });
    }, { threshold: 0.3 });

    if (aboutSection) {
        observer.observe(aboutSection);
    }
});