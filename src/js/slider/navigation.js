// Navigation UI functions
export const createSlidesNavigation = (slides) => {
  const navContainer = document.getElementById("slidesNav");
  navContainer.innerHTML = "";
  slides.forEach((slide, index) => {
    const navItem = document.createElement("div");
    navItem.className = `slide-nav-item ${index === 0 ? "active" : ""}`;
    navItem.dataset.slideIndex = index;
    navItem.innerHTML = `
      <div class="slide-progress-line">
        <div class="slide-progress-fill" style="width: 0%"></div>
      </div>
      <div class="slide-nav-title" data-i18n="${slide.title}"></div>
    `;
    navContainer.appendChild(navItem);
  });
};

export const updateNavigationState = (activeIndex) => {
  const navItems = document.querySelectorAll(".slide-nav-item");
  navItems.forEach((item, index) => {
    item.classList.toggle("active", index === activeIndex);
  });
};

export const updateSlideProgress = (slideIndex, progress) => {
  const navItems = document.querySelectorAll(".slide-nav-item");
  if (navItems[slideIndex]) {
    const progressFill = navItems[slideIndex].querySelector(".slide-progress-fill");
    progressFill.style.width = `${progress}%`;
    progressFill.style.opacity = "1";
  }
};

export const fadeSlideProgress = (slideIndex) => {
  const navItems = document.querySelectorAll(".slide-nav-item");
  if (navItems[slideIndex]) {
    const progressFill = navItems[slideIndex].querySelector(".slide-progress-fill");
    progressFill.style.opacity = "0";
    setTimeout(() => (progressFill.style.width = "0%"), 300);
  }
};

export const quickResetProgress = (slideIndex) => {
  const navItems = document.querySelectorAll(".slide-nav-item");
  if (navItems[slideIndex]) {
    const progressFill = navItems[slideIndex].querySelector(".slide-progress-fill");
    progressFill.style.transition = "width 0.2s ease-out";
    progressFill.style.width = "0%";
    setTimeout(() => {
      progressFill.style.transition = "width 0.1s ease, opacity 0.3s ease";
    }, 200);
  }
};

export const updateCounter = (index, total) => {
  const slideNumber = document.getElementById("slideNumber");
  slideNumber.textContent = String(index + 1).padStart(2, "0");
  const slideTotal = document.getElementById("slideTotal");
  slideTotal.textContent = String(total).padStart(2, "0");
};
