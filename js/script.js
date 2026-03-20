/* ===========================================
   YATRA NEPAL - Main JavaScript
   With Formspree Integration (FIXED)
   =========================================== */

(function () {
    'use strict';

    // ==============================================
    //  UTILITIES
    // ==============================================

    function $(sel) { return document.querySelector(sel); }
    function $$(sel) { return document.querySelectorAll(sel); }

    function onReady(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    function onEvent(el, ev, fn) {
        if (el) el.addEventListener(ev, fn);
    }

    function addClass(el, c) { if (el) el.classList.add(c); }
    function removeClass(el, c) { if (el) el.classList.remove(c); }
    function hasClass(el, c) { return el ? el.classList.contains(c) : false; }

    function toggleClass(el, c, force) {
        if (!el) return;
        if (typeof force !== 'undefined') el.classList.toggle(c, force);
        else el.classList.toggle(c);
    }

    // ==============================================
    //  INIT
    // ==============================================

    onReady(function () {
        initPreloader();
        initNavbar();
        initMobileMenu();
        initScrollReveal();
        initCounterAnimation();
        initWishlist();
        initTourFilter();
        initTestimonialSlider();
        initGalleryLightbox();
        initNewsletterForm();
        initContactForm();
        initBookingForm();
        initFaqAccordion();
        initDestinationFilter();
        initBackToTop();
        initHeroParallax();
        initDateInputs();
    });

    // ==============================================
    //  FORMSPREE SUBMIT HELPER
    //  Reusable function for all forms
    // ==============================================

    function submitToFormspree(form, successMessage, onSuccessCallback) {
        var action = form.getAttribute('action');

        // Safety check: if no action, warn and stop
        if (!action || action.indexOf('formspree') === -1) {
            console.error('Form has no valid Formspree action URL');
            showToast('Form configuration error. Contact admin.', 'error');
            return;
        }

        // Get submit button and show loading
        var submitBtn = form.querySelector('button[type="submit"]');
        var originalHTML = '';
        if (submitBtn) {
            originalHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
        }

        // Collect all form data from inputs with name attribute
        var formData = new FormData(form);

        // Debug: log what we're sending
        console.log('--- Sending to Formspree ---');
        formData.forEach(function (value, key) {
            console.log(key + ': ' + value);
        });

        // Send via fetch (AJAX - no page redirect)
        fetch(action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(function (response) {
            console.log('Formspree response status:', response.status);

            if (response.ok) {
                showToast(successMessage || 'Sent successfully!', 'success');
                if (onSuccessCallback) onSuccessCallback();
            } else {
                // Try to get error details
                return response.json().then(function (data) {
                    console.error('Formspree error details:', data);
                    var errorMsg = 'Failed to send.';
                    if (data.errors && data.errors.length > 0) {
                        errorMsg = data.errors[0].message || errorMsg;
                    }
                    showToast(errorMsg, 'error');
                });
            }
        })
        .catch(function (error) {
            console.error('Network error:', error);
            showToast('Network error. Check your connection and try again.', 'error');
        })
        .finally(function () {
            // Restore submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHTML;
            }
        });
    }

    // ==============================================
    //  FORM VALIDATION HELPER
    // ==============================================

    function validateRequiredFields(container) {
        var isValid = true;
        var requiredInputs = container.querySelectorAll('[required]');

        for (var i = 0; i < requiredInputs.length; i++) {
            var input = requiredInputs[i];
            var group = input.closest('.form-group');

            // Skip checkboxes (handled separately)
            if (input.type === 'checkbox') continue;

            if (!input.value.trim()) {
                if (group) addClass(group, 'error');
                isValid = false;
            } else {
                if (group) removeClass(group, 'error');
            }
        }

        // Check email format if email field exists
        var emailInput = container.querySelector('input[type="email"]');
        if (emailInput && emailInput.value.trim()) {
            if (!isValidEmail(emailInput.value)) {
                var emailGroup = emailInput.closest('.form-group');
                if (emailGroup) addClass(emailGroup, 'error');
                isValid = false;
            }
        }

        return isValid;
    }

    // ==============================================
    //  1. PRELOADER
    // ==============================================

    function initPreloader() {
        var preloader = $('#preloader');
        if (!preloader) return;

        function hide() { addClass(preloader, 'hidden'); }

        window.addEventListener('load', function () {
            setTimeout(hide, 1200);
        });
        setTimeout(hide, 4000);
    }

    // ==============================================
    //  2. NAVBAR
    // ==============================================

    function initNavbar() {
        var navbar = $('#navbar');
        if (!navbar) return;
        var hasHero = $('.hero') !== null;

        function update() {
            if (hasHero) toggleClass(navbar, 'scrolled', window.scrollY > 60);
        }

        window.addEventListener('scroll', update);
        update();
    }

    // ==============================================
    //  3. MOBILE MENU
    // ==============================================

    function initMobileMenu() {
        var hamburger = $('#hamburger');
        var navLinks = $('#navLinks');
        var overlay = $('#navOverlay');
        if (!hamburger || !navLinks) return;

        function close() {
            removeClass(hamburger, 'active');
            removeClass(navLinks, 'active');
            if (overlay) removeClass(overlay, 'active');
            document.body.style.overflow = '';
        }

        function toggle() {
            if (hasClass(navLinks, 'active')) {
                close();
            } else {
                addClass(hamburger, 'active');
                addClass(navLinks, 'active');
                if (overlay) addClass(overlay, 'active');
                document.body.style.overflow = 'hidden';
            }
        }

        onEvent(hamburger, 'click', toggle);
        if (overlay) onEvent(overlay, 'click', close);

        var links = navLinks.querySelectorAll('a');
        for (var i = 0; i < links.length; i++) {
            onEvent(links[i], 'click', close);
        }
    }

    // ==============================================
    //  4. SCROLL REVEAL
    // ==============================================

    function initScrollReveal() {
        var els = $$('.reveal');
        if (els.length === 0) return;

        if (!('IntersectionObserver' in window)) {
            for (var i = 0; i < els.length; i++) addClass(els[i], 'visible');
            return;
        }

        var obs = new IntersectionObserver(function (entries) {
            for (var j = 0; j < entries.length; j++) {
                if (entries[j].isIntersecting) {
                    addClass(entries[j].target, 'visible');
                    obs.unobserve(entries[j].target);
                }
            }
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        for (var k = 0; k < els.length; k++) obs.observe(els[k]);
    }

    // ==============================================
    //  5. COUNTER ANIMATION
    // ==============================================

    function initCounterAnimation() {
        var counters = $$('.counter');
        var heroStats = $('.hero-stats');
        if (!heroStats || counters.length === 0) return;

        var started = false;

        function start() {
            if (started) return;
            started = true;
            for (var i = 0; i < counters.length; i++) animate(counters[i]);
        }

        function animate(el) {
            var target = parseInt(el.getAttribute('data-target'), 10);
            var duration = 2000;
            var startTime = null;

            function frame(ts) {
                if (!startTime) startTime = ts;
                var progress = Math.min((ts - startTime) / duration, 1);
                var eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.ceil(eased * target);
                if (progress < 1) requestAnimationFrame(frame);
                else el.textContent = target;
            }

            requestAnimationFrame(frame);
        }

        if ('IntersectionObserver' in window) {
            var obs = new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting) { start(); obs.disconnect(); }
            }, { threshold: 0.4 });
            obs.observe(heroStats);
        } else {
            start();
        }
    }

    // ==============================================
    //  6. WISHLIST
    // ==============================================

    function initWishlist() {
        var btns = $$('.dest-wishlist');

        for (var i = 0; i < btns.length; i++) {
            onEvent(btns[i], 'click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var icon = this.querySelector('i');
                if (!icon) return;
                toggleClass(this, 'liked');
                if (hasClass(this, 'liked')) {
                    icon.className = 'fa-solid fa-heart';
                    showToast('Added to your wishlist!', 'success');
                } else {
                    icon.className = 'fa-regular fa-heart';
                    showToast('Removed from wishlist', 'error');
                }
            });
        }
    }

    // ==============================================
    //  7. TOUR FILTER
    // ==============================================

    function initTourFilter() {
        var tabs = $$('.tour-tab');
        var cards = $$('.tour-card');
        if (tabs.length === 0 || cards.length === 0) return;

        for (var i = 0; i < tabs.length; i++) {
            onEvent(tabs[i], 'click', function () {
                var filter = this.getAttribute('data-filter');
                for (var t = 0; t < tabs.length; t++) removeClass(tabs[t], 'active');
                addClass(this, 'active');

                for (var c = 0; c < cards.length; c++) {
                    var cat = cards[c].getAttribute('data-category');
                    var show = (filter === 'all' || cat === filter);
                    if (show) {
                        cards[c].style.display = 'flex';
                        cards[c].style.opacity = '0';
                        (function (card) {
                            setTimeout(function () { card.style.opacity = '1'; }, 50);
                        })(cards[c]);
                    } else {
                        cards[c].style.opacity = '0';
                        (function (card) {
                            setTimeout(function () { card.style.display = 'none'; }, 350);
                        })(cards[c]);
                    }
                }
            });
        }
    }

    // ==============================================
    //  8. TESTIMONIAL SLIDER
    // ==============================================

    function initTestimonialSlider() {
        var track = $('#testimonialTrack');
        var dotsWrap = $('#testimonialDots');
        var prevBtn = $('#prevTest');
        var nextBtn = $('#nextTest');
        if (!track || !dotsWrap) return;

        var slides = track.querySelectorAll('.testimonial-card');
        var total = slides.length;
        var current = 0;
        var timer = null;

        for (var i = 0; i < total; i++) {
            var dot = document.createElement('div');
            dot.className = 't-dot' + (i === 0 ? ' active' : '');
            (function (idx) {
                onEvent(dot, 'click', function () { goTo(idx); restart(); });
            })(i);
            dotsWrap.appendChild(dot);
        }

        onEvent(prevBtn, 'click', function () { goTo(current - 1); restart(); });
        onEvent(nextBtn, 'click', function () { goTo(current + 1); restart(); });
        onEvent(track, 'mouseenter', stop);
        onEvent(track, 'mouseleave', play);
        play();

        function goTo(idx) {
            if (idx < 0) idx = total - 1;
            if (idx >= total) idx = 0;
            current = idx;
            track.style.transform = 'translateX(-' + (idx * 100) + '%)';
            var dots = dotsWrap.querySelectorAll('.t-dot');
            for (var d = 0; d < dots.length; d++) toggleClass(dots[d], 'active', d === idx);
        }

        function play() { stop(); timer = setInterval(function () { goTo(current + 1); }, 5000); }
        function stop() { if (timer) { clearInterval(timer); timer = null; } }
        function restart() { stop(); play(); }
    }

    // ==============================================
    //  9. GALLERY LIGHTBOX
    // ==============================================

    function initGalleryLightbox() {
        var items = $$('.gallery-item');
        var lightbox = $('#lightbox');
        var lbImg = $('#lightboxImg');
        var closeBtn = $('#lightboxClose');
        var prevBtn = $('#lightboxPrev');
        var nextBtn = $('#lightboxNext');
        if (!lightbox || items.length === 0) return;

        var images = [];
        var current = 0;

        for (var i = 0; i < items.length; i++) {
            var img = items[i].querySelector('img');
            if (img) images.push(img.getAttribute('src'));
            (function (idx) {
                onEvent(items[idx], 'click', function () { openLB(idx); });
            })(i);
        }

        onEvent(closeBtn, 'click', closeLB);
        onEvent(lightbox, 'click', function (e) { if (e.target === lightbox) closeLB(); });
        onEvent(prevBtn, 'click', function (e) { e.stopPropagation(); prevImg(); });
        onEvent(nextBtn, 'click', function (e) { e.stopPropagation(); nextImg(); });

        document.addEventListener('keydown', function (e) {
            if (!hasClass(lightbox, 'active')) return;
            if (e.key === 'Escape') closeLB();
            if (e.key === 'ArrowLeft') prevImg();
            if (e.key === 'ArrowRight') nextImg();
        });

        function openLB(idx) {
            current = idx;
            lbImg.src = images[idx];
            addClass(lightbox, 'active');
            document.body.style.overflow = 'hidden';
        }

        function closeLB() {
            removeClass(lightbox, 'active');
            document.body.style.overflow = '';
        }

        function nextImg() { current = (current + 1) % images.length; lbImg.src = images[current]; }
        function prevImg() { current = (current - 1 + images.length) % images.length; lbImg.src = images[current]; }
    }

    // ==============================================
    //  10. NEWSLETTER FORM → Formspree
    // ==============================================

    function initNewsletterForm() {
        var form = $('#newsletterForm');
        if (!form) return;

        onEvent(form, 'submit', function (e) {
            e.preventDefault();

            var emailInput = $('#newsletterEmail');

            if (!emailInput || !emailInput.value.trim()) {
                showToast('Please enter your email address.', 'error');
                return;
            }

            if (!isValidEmail(emailInput.value)) {
                showToast('Please enter a valid email address.', 'error');
                return;
            }

            submitToFormspree(form, 'You\'re subscribed! Welcome aboard.', function () {
                form.reset();
            });
        });
    }

    // ==============================================
    //  11. CONTACT FORM → Formspree
    // ==============================================

    function initContactForm() {
        var form = $('#contactForm');
        if (!form) return;

        // Clear errors on typing
        var allInputs = form.querySelectorAll('input, textarea, select');
        for (var j = 0; j < allInputs.length; j++) {
            onEvent(allInputs[j], 'input', function () {
                var g = this.closest('.form-group');
                if (g) removeClass(g, 'error');
            });
        }

        onEvent(form, 'submit', function (e) {
            e.preventDefault();

            // Validate
            if (!validateRequiredFields(form)) {
                showToast('Please fill in all required fields correctly.', 'error');
                return;
            }

            // Send to Formspree
            submitToFormspree(form, 'Message sent! We\'ll reply within 24 hours.', function () {
                form.reset();
            });
        });
    }

    // ==============================================
    //  12. BOOKING FORM (Multi-Step) → Formspree
    // ==============================================

function initBookingForm() {
    var form = $('#bookingForm');
    if (!form) return;

    var stepIndicators = $$('.step');
    var stepLines = $$('.step-line');
    var formPanels = $$('.form-step');
    var nextButtons = $$('.next-step');
    var prevButtons = $$('.prev-step');
    var currentStep = 1;

    // --- NEXT BUTTONS ---
    for (var n = 0; n < nextButtons.length; n++) {
        onEvent(nextButtons[n], 'click', function () {
            var targetStep = parseInt(this.getAttribute('data-next'), 10);

            var currentPanel = document.getElementById('formStep' + currentStep);
            if (currentPanel && !validateRequiredFields(currentPanel)) {
                showToast('Please fill in all required fields.', 'error');
                return;
            }

            if (targetStep === 3) fillReviewData();
            navigateToStep(targetStep);
        });
    }

    // --- PREV BUTTONS ---
    for (var p = 0; p < prevButtons.length; p++) {
        onEvent(prevButtons[p], 'click', function () {
            navigateToStep(parseInt(this.getAttribute('data-prev'), 10));
        });
    }

    // --- CLEAR ERRORS ---
    var formInputs = form.querySelectorAll('input, textarea, select');
    for (var f = 0; f < formInputs.length; f++) {
        onEvent(formInputs[f], 'input', function () {
            var g = this.closest('.form-group');
            if (g) removeClass(g, 'error');
        });
        onEvent(formInputs[f], 'change', function () {
            var g = this.closest('.form-group');
            if (g) removeClass(g, 'error');
        });
    }

    // =============================================
    //  CONFIRM BOOKING BUTTON — NO form submit
    //  Sends data directly via fetch
    // =============================================
    var confirmBtn = document.getElementById('confirmBookingBtn');

    if (confirmBtn) {
        confirmBtn.addEventListener('click', function () {

            // 1. Check terms
            var termsCheckbox = document.getElementById('agreeTerms');
            if (!termsCheckbox || !termsCheckbox.checked) {
                showToast('Please agree to the Terms & Conditions.', 'error');
                return;
            }

            // 2. Show loading
            var originalHTML = confirmBtn.innerHTML;
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

            // 3. Manually collect ALL the data
            var bookingData = {
                form_type: 'Booking Request',
                _subject: 'New Booking from Yatra Nepal',
                firstName: getInputValue('bookFirstName'),
                lastName: getInputValue('bookLastName'),
                email: getInputValue('bookEmail'),
                phone: getInputValue('bookPhone'),
                country: getSelectText('bookCountry'),
                destination: getSelectText('bookDestination'),
                tripType: getSelectText('bookTripType'),
                startDate: getInputValue('bookStartDate'),
                endDate: getInputValue('bookEndDate'),
                travelers: getSelectText('bookTravelers'),
                budget: getSelectText('bookBudget'),
                specialRequests: getInputValue('bookNotes')
            };

            // 4. Debug — check what we are sending
            console.log('Booking data being sent:', bookingData);

            // 5. Send to Formspree
            fetch('https://formspree.io/f/xjgazbny', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(bookingData)
            })
            .then(function (response) {
                console.log('Response status:', response.status);

                if (response.ok) {
                    // Show success
                    form.style.display = 'none';
                    var stepsBar = document.querySelector('.booking-steps');
                    if (stepsBar) stepsBar.style.display = 'none';
                    var successPanel = document.getElementById('bookingSuccess');
                    if (successPanel) successPanel.style.display = 'block';
                    showToast('Booking submitted successfully!', 'success');
                } else {
                    response.json().then(function (data) {
                        console.error('Formspree error:', data);
                        showToast('Failed to submit. Try again.', 'error');
                    });
                }
            })
            .catch(function (error) {
                console.error('Network error:', error);
                showToast('Network error. Check connection.', 'error');
            })
            .finally(function () {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = originalHTML;
            });
        });
    }

    // --- STEP NAVIGATION ---
    function navigateToStep(stepNumber) {
        currentStep = stepNumber;

        for (var i = 0; i < formPanels.length; i++) {
            removeClass(formPanels[i], 'active');
        }
        var targetPanel = document.getElementById('formStep' + stepNumber);
        if (targetPanel) addClass(targetPanel, 'active');

        for (var s = 0; s < stepIndicators.length; s++) {
            removeClass(stepIndicators[s], 'active');
            removeClass(stepIndicators[s], 'completed');
            if (s + 1 < stepNumber) addClass(stepIndicators[s], 'completed');
            else if (s + 1 === stepNumber) addClass(stepIndicators[s], 'active');
        }

        for (var l = 0; l < stepLines.length; l++) {
            toggleClass(stepLines[l], 'active', l < stepNumber - 1);
        }

        var wrapper = document.querySelector('.booking-wrapper');
        if (wrapper) wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // --- FILL REVIEW ---
    function fillReviewData() {
        setTextContent('reviewName', getInputValue('bookFirstName') + ' ' + getInputValue('bookLastName'));
        setTextContent('reviewEmail', getInputValue('bookEmail'));
        setTextContent('reviewPhone', getInputValue('bookPhone') || 'Not provided');
        setTextContent('reviewCountry', getSelectText('bookCountry') || 'Not specified');
        setTextContent('reviewDest', getSelectText('bookDestination'));
        setTextContent('reviewType', getSelectText('bookTripType'));
        setTextContent('reviewTravelers', getSelectText('bookTravelers'));

        var dateStr = getInputValue('bookStartDate') || 'Not set';
        if (getInputValue('bookEndDate')) dateStr += ' to ' + getInputValue('bookEndDate');
        setTextContent('reviewDates', dateStr);
    }
}

    // ==============================================
    //  13. FAQ ACCORDION
    // ==============================================

    function initFaqAccordion() {
        var items = $$('.faq-item');
        if (items.length === 0) return;

        for (var i = 0; i < items.length; i++) {
            var q = items[i].querySelector('.faq-question');
            if (!q) continue;

            (function (item) {
                onEvent(q, 'click', function () {
                    var isOpen = hasClass(item, 'active');
                    for (var j = 0; j < items.length; j++) removeClass(items[j], 'active');
                    if (!isOpen) addClass(item, 'active');
                });
            })(items[i]);
        }
    }

    // ==============================================
    //  14. DESTINATION FILTER
    // ==============================================

    function initDestinationFilter() {
        var searchInput = $('#destSearch');
        var regionSelect = $('#regionFilter');
        var typeSelect = $('#typeFilter');
        var sortSelect = $('#sortFilter');
        var grid = $('#allDestGrid');
        if (!grid) return;

        var cards = [];
        var cardEls = grid.querySelectorAll('.dest-card');
        for (var i = 0; i < cardEls.length; i++) cards.push(cardEls[i]);

        if (searchInput) onEvent(searchInput, 'input', filter);
        if (regionSelect) onEvent(regionSelect, 'change', filter);
        if (typeSelect) onEvent(typeSelect, 'change', filter);
        if (sortSelect) onEvent(sortSelect, 'change', filter);

        function filter() {
            var search = searchInput ? searchInput.value.toLowerCase().trim() : '';
            var region = regionSelect ? regionSelect.value : 'all';
            var type = typeSelect ? typeSelect.value : 'all';
            var count = 0;

            for (var c = 0; c < cards.length; c++) {
                var card = cards[c];
                var show = true;
                if (search && card.getAttribute('data-name').toLowerCase().indexOf(search) === -1) show = false;
                if (region !== 'all' && card.getAttribute('data-region') !== region) show = false;
                if (type !== 'all' && card.getAttribute('data-type') !== type) show = false;
                card.style.display = show ? 'block' : 'none';
                if (show) count++;
            }

            if (sortSelect) {
                var sv = sortSelect.value;
                var visible = cards.filter(function (c) { return c.style.display !== 'none'; });
                visible.sort(function (a, b) {
                    var pA = parseInt(a.getAttribute('data-price'), 10);
                    var pB = parseInt(b.getAttribute('data-price'), 10);
                    if (sv === 'price-low') return pA - pB;
                    if (sv === 'price-high') return pB - pA;
                    return 0;
                });
                for (var s = 0; s < visible.length; s++) grid.appendChild(visible[s]);
            }

            var rc = $('#resultsCount');
            if (rc) rc.textContent = 'Showing ' + count + ' destination' + (count !== 1 ? 's' : '');
        }
    }

    // ==============================================
    //  15. BACK TO TOP
    // ==============================================

    function initBackToTop() {
        var btn = $('#backToTop');
        if (!btn) return;
        window.addEventListener('scroll', function () {
            toggleClass(btn, 'visible', window.scrollY > 500);
        });
        onEvent(btn, 'click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==============================================
    //  16. HERO PARALLAX
    // ==============================================

    function initHeroParallax() {
        var hero = $('.hero');
        if (!hero) return;
        window.addEventListener('scroll', function () {
            if (window.scrollY < window.innerHeight) {
                hero.style.backgroundPositionY = (window.scrollY * 0.3) + 'px';
            }
        });
    }

    // ==============================================
    //  17. DATE INPUTS
    // ==============================================

    function initDateInputs() {
        var now = new Date();
        var today = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0');

        var inputs = $$('input[type="date"]');
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].setAttribute('min', today);
        }
    }

    // ==============================================
    //  18. TOAST
    // ==============================================

    function showToast(message, type) {
        type = type || 'success';
        var container = $('#toastContainer');
        if (!container) return;

        var toast = document.createElement('div');
        toast.className = 'toast ' + type;
        var iconClass = (type === 'success')
            ? 'fa-solid fa-circle-check'
            : 'fa-solid fa-triangle-exclamation';

        toast.innerHTML =
            '<span class="toast-icon"><i class="' + iconClass + '"></i></span>' +
            '<span class="toast-msg">' + message + '</span>';

        container.appendChild(toast);

        setTimeout(function () {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 400ms ease';
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 400);
        }, 3500);
    }

    window.showToast = showToast;

    // ==============================================
    //  HELPERS
    // ==============================================

    function isValidEmail(email) {
        return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
    }

    function getInputValue(id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }

    function getSelectText(id) {
        var el = document.getElementById(id);
        return el ? el.options[el.selectedIndex].text : '';
    }

    function setTextContent(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text || '-';
    }

})();