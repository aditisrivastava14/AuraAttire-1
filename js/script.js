(() => {
  const CART_KEY = "auraattire_cart_count";
  const CART_ITEMS_KEY = "auraattire_cart_items";

  function getItems() {
    try {
      const raw = localStorage.getItem(CART_ITEMS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveItems(items) {
    localStorage.setItem(CART_ITEMS_KEY, JSON.stringify(items));
  }

  function getCartCount() {
    const raw = localStorage.getItem(CART_KEY);
    const n = Number.parseInt(raw ?? "0", 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function setCartCount(n) {
    const safe = Math.max(0, Number.isFinite(n) ? n : 0);
    localStorage.setItem(CART_KEY, String(safe));
    return safe;
  }

  function updateCartUI(count) {
    const el = document.querySelector("#cart-count");
    if (!el) return;
    el.textContent = String(count);
    el.classList.remove("bump");
    // reflow to restart animation
    void el.offsetWidth;
    el.classList.add("bump");
    window.setTimeout(() => el.classList.remove("bump"), 220);
  }

  function closeMobileNav() {
    document.body.classList.remove("nav-open");
    const toggle = document.querySelector(".nav-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.classList.add("page-ready");

    // cart init
    const existingItems = getItems();
    const initialCount = existingItems.length || getCartCount();
    setCartCount(initialCount);
    updateCartUI(initialCount);

    const cartTrigger = document.querySelector(".cart-trigger");
    const cartOverlay = document.querySelector(".cart-overlay");
    const cartPanel = document.querySelector(".cart-panel");

    function renderCart() {
      if (!cartPanel) return;
      const list = cartPanel.querySelector(".cart-items");
      const empty = cartPanel.querySelector(".cart-empty");
      const subtotalEl = cartPanel.querySelector(".cart-subtotal-amount");
      const items = getItems();

      if (!list || !empty || !subtotalEl) return;

      list.innerHTML = "";
      if (!items.length) {
        empty.removeAttribute("hidden");
        subtotalEl.textContent = "₹0";
      } else {
        empty.setAttribute("hidden", "true");
        let subtotal = 0;
        items.forEach((item, idx) => {
          const li = document.createElement("li");
          li.className = "cart-line";
          li.dataset.index = String(idx);
          const priceNumber = Number(String(item.price).replace(/[^\d]/g, "")) || 0;
          subtotal += priceNumber;
          li.innerHTML = `
            <div class="info">
              <div class="name">${item.name ?? "Item"}</div>
              <div class="meta">${item.price ?? ""}</div>
            </div>
            <button class="remove-line" type="button" aria-label="Remove ${item.name ?? "item"}">
              ×
            </button>
          `;
          list.appendChild(li);
        });
        subtotalEl.textContent = `₹${subtotal.toLocaleString("en-IN")}`;
      }
    }

    function openCart() {
      if (!cartOverlay || !cartPanel) return;
      document.body.classList.add("cart-open");
      renderCart();
      window.setTimeout(() => {
        cartPanel.setAttribute("aria-hidden", "false");
        cartOverlay.setAttribute("aria-hidden", "false");
      }, 10);
    }

    function closeCart() {
      if (!cartOverlay || !cartPanel) return;
      document.body.classList.remove("cart-open");
      cartPanel.setAttribute("aria-hidden", "true");
      cartOverlay.setAttribute("aria-hidden", "true");
    }

    cartTrigger?.addEventListener("click", () => {
      if (document.body.classList.contains("cart-open")) closeCart();
      else openCart();
    });

    cartOverlay?.addEventListener("click", (e) => {
      if (e.target === cartOverlay) closeCart();
    });

    // mobile nav
    const toggle = document.querySelector(".nav-toggle");
    toggle?.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;

      // close nav when clicking a link
      const navLink = t.closest(".nav-links a");
      if (navLink) closeMobileNav();

      const closeDrawerBtn = t.closest("[data-close-cart]");
      if (closeDrawerBtn) {
        closeCart();
        return;
      }

      const removeLine = t.closest(".remove-line");
      if (removeLine && removeLine.parentElement?.dataset.index != null) {
        const idx = Number.parseInt(removeLine.parentElement.dataset.index, 10);
        const items = getItems();
        if (Number.isFinite(idx) && idx >= 0 && idx < items.length) {
          items.splice(idx, 1);
          saveItems(items);
          const newCount = items.length;
          setCartCount(newCount);
          updateCartUI(newCount);
          renderCart();
        }
        return;
      }

      const clearCartBtn = t.closest("[data-clear-cart]");
      if (clearCartBtn) {
        saveItems([]);
        setCartCount(0);
        updateCartUI(0);
        renderCart();
        return;
      }

      const checkoutBtn = t.closest("[data-checkout]");
      if (checkoutBtn) {
        const items = getItems();
        if (!items.length) {
          alert("Your cart is empty.");
          return;
        }
        let total = 0;
        for (const item of items) {
          total += Number(String(item.price).replace(/[^\d]/g, "")) || 0;
        }
        alert(
          `Demo checkout\n\nItems: ${items.length}\nTotal: ₹${total.toLocaleString(
            "en-IN"
          )}\n\nIn a real store, you would now proceed to payment.`
        );
        return;
      }

      const viewBtn = t.closest("button.view-details");
      if (viewBtn) {
        const card = viewBtn.closest(".product-card");
        const name = card?.getAttribute("data-name") ?? "this item";
        const price = card?.getAttribute("data-price") ?? "";
        alert(`Details\n\n${name}${price ? ` — ${price}` : ""}\n\n(Replace this with a real product page later.)`);
        return;
      }

      const addBtn = t.closest("button.add-to-cart");
      if (addBtn) {
        const card = addBtn.closest(".product-card");
        const name = card?.getAttribute("data-name") ?? "Item";
        const price = card?.getAttribute("data-price") ?? "";
        const items = getItems();
        items.push({
          name,
          price,
          addedAt: Date.now(),
          source: window.location.pathname,
        });
        saveItems(items);
        const count = setCartCount(items.length);
        updateCartUI(count);

        if (document.body.classList.contains("cart-open")) {
          renderCart();
        }

        addBtn.textContent = "Added";
        addBtn.disabled = true;
        window.setTimeout(() => {
          addBtn.textContent = "Add to Cart";
          addBtn.disabled = false;
        }, 900);

        // subtle feedback
        console.log(`Added to cart: ${name}`);
        return;
      }
    });

    // Esc closes nav
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (document.body.classList.contains("cart-open")) {
          e.preventDefault();
          closeCart();
        } else {
          closeMobileNav();
        }
      }
    });

    // Scroll-based effects (navbar + hero parallax)
    const root = document.documentElement;
    const handleScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      if (y > 10) {
        root.classList.add("is-scrolled");
      } else {
        root.classList.remove("is-scrolled");
      }
      const parallax = Math.min(y * 0.25, 140);
      root.style.setProperty("--hero-parallax", `${parallax}px`);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Reveal-on-scroll animations
    const revealables = Array.from(
      document.querySelectorAll(".hero, .section, .card, .panel, .footer")
    );
    revealables.forEach((el) => el.classList.add("reveal-on-scroll"));

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.classList.add("in-view");
                  observer.unobserve(entry.target);
                }
              });
            },
            {
              threshold: 0.12,
            }
          )
        : null;

    if (observer) {
      revealables.forEach((el) => observer.observe(el));
    } else {
      revealables.forEach((el) => el.classList.add("in-view"));
    }

    // Contact form
    const form = document.querySelector("form[data-contact-form]");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = String(fd.get("name") ?? "").trim();
      const email = String(fd.get("email") ?? "").trim();
      const message = String(fd.get("message") ?? "").trim();

      if (!name || !email || !message) {
        alert("Please fill in Name, Email, and Message.");
        return;
      }
      alert(`Thanks, ${name}! We received your message and will reply to ${email}.`);
      form.reset();
    });
  });
})();
