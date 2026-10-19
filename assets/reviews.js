import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

import { auth, db } from "./firebase-client.js";

const reviewStage = document.getElementById("reviewStage");
const reviewCount = document.getElementById("reviewCount");
const averageRating = document.getElementById("averageRating");
const averageStars = document.getElementById("averageStars");
const reviewControls = document.getElementById("reviewControls");
const reviewDots = document.getElementById("reviewDots");
const form = document.getElementById("reviewForm");
const formMessage = document.getElementById("formMessage");
const submitButton = document.getElementById("submitReview");
const starsInput = document.getElementById("reviewStars");
const starButtons = [...document.querySelectorAll("#starRatingGroup [data-stars]")];
starButtons.forEach((button, index) => { button.tabIndex = index === 0 ? 0 : -1; });
let reviewCards = [];
let activeReviewIndex = 0;
let slideTimer = null;
let carouselPaused = false;
const formStartedAt = Date.now();

function setFormMessage(message, kind = "error") {
  formMessage.textContent = message;
  formMessage.className = `form-message${kind === "success" ? " is-success" : kind === "neutral" ? " is-neutral" : ""}`;
}

function setStarRating(value) {
  starsInput.value = String(value);
  starButtons.forEach(button => {
    const selected = Number(button.dataset.stars) === value;
    button.setAttribute("aria-checked", String(selected));
    button.tabIndex = selected ? 0 : -1;
    button.classList.toggle("is-lit", Number(button.dataset.stars) <= value);
  });
  formMessage.textContent = "";
}

starButtons.forEach((button, index) => {
  button.addEventListener("click", () => setStarRating(Number(button.dataset.stars)));
  button.addEventListener("keydown", event => {
    let nextIndex = index;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") nextIndex = Math.min(starButtons.length - 1, index + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") nextIndex = Math.max(0, index - 1);
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = starButtons.length - 1;
    else return;
    event.preventDefault();
    const nextButton = starButtons[nextIndex];
    setStarRating(Number(nextButton.dataset.stars));
    nextButton.focus();
  });
});

function createStars(value, className) {
  const stars = document.createElement("div");
  stars.className = className;
  stars.textContent = "★".repeat(value) + "☆".repeat(5 - value);
  stars.setAttribute("aria-label", `${value} out of 5 stars`);
  return stars;
}

function setReview(index, direction = 1) {
  if (!reviewCards.length) return;
  activeReviewIndex = (index + reviewCards.length) % reviewCards.length;
  reviewCards.forEach((card, cardIndex) => {
    card.classList.remove("is-active");
    card.style.setProperty("--review-offset", `${direction * 25}px`);
    if (cardIndex === activeReviewIndex) card.classList.add("is-active");
  });
  [...reviewDots.children].forEach((dot, dotIndex) => dot.setAttribute("aria-current", String(dotIndex === activeReviewIndex)));
  window.clearTimeout(slideTimer);
  if (reviewCards.length > 1 && !carouselPaused && !document.hidden && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    slideTimer = window.setTimeout(() => setReview(activeReviewIndex + 1, 1), 8200);
  }
}

function renderReviews(reviews) {
  reviewStage.replaceChildren();
  reviewCards = [];
  reviewDots.replaceChildren();
  if (!reviews.length) {
    const empty = document.createElement("p");
    empty.className = "review-empty";
    empty.textContent = "No approved reviews yet. Be the first to share your experience.";
    reviewStage.append(empty);
    reviewCount.textContent = "0 reviews";
    averageRating.textContent = "—";
    averageStars.textContent = "☆☆☆☆☆";
    averageStars.setAttribute("aria-label", "No ratings yet");
    reviewControls.hidden = true;
    return;
  }

  const totalStars = reviews.reduce((sum, item) => sum + item.stars, 0);
  const average = Math.round((totalStars / reviews.length) * 10) / 10;
  const fullAverageStars = Math.round(average);
  averageRating.textContent = `${average.toFixed(1)}/5`;
  averageStars.textContent = "★".repeat(fullAverageStars) + "☆".repeat(5 - fullAverageStars);
  averageStars.setAttribute("aria-label", `${average.toFixed(1)} out of 5 average rating`);
  reviewCount.textContent = `${reviews.length} ${reviews.length === 1 ? "approved review" : "approved reviews"}`;

  reviews.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "review-card";
    card.setAttribute("aria-roledescription", "slide");
    const stars = createStars(item.stars, "review-card-stars");
    const quote = document.createElement("blockquote");
    quote.textContent = `“${item.review}”`;
    const author = document.createElement("p");
    author.className = "review-card-author";
    author.textContent = item.name;
    card.append(stars, quote, author);
    reviewStage.append(card);
    reviewCards.push(card);

    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "review-dot";
    dot.setAttribute("aria-label", `Show review ${index + 1}`);
    dot.setAttribute("aria-current", "false");
    dot.addEventListener("click", () => setReview(index, index >= activeReviewIndex ? 1 : -1));
    reviewDots.append(dot);
  });

  reviewControls.hidden = reviews.length < 2;
  setReview(0);
}

async function loadReviews() {
  try {
    const result = await getDocs(query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(100)));
    const approvedReviews = result.docs.map(snapshot => snapshot.data()).filter(item =>
      typeof item.name === "string" && item.name.trim() &&
      typeof item.review === "string" && item.review.trim() &&
      Number.isInteger(item.stars) && item.stars >= 1 && item.stars <= 5
    );
    renderReviews(approvedReviews);
  } catch (error) {
    console.error("Could not load approved customer reviews.", error);
    reviewStage.replaceChildren();
    const message = document.createElement("p");
    message.className = "review-empty";
    message.textContent = "Reviews are temporarily unavailable. Please try again soon.";
    reviewStage.append(message);
    reviewCount.textContent = "Reviews unavailable";
  }
}

const previousReview = document.getElementById("previousReview");
const nextReview = document.getElementById("nextReview");
previousReview.addEventListener("click", () => setReview(activeReviewIndex - 1, -1));
nextReview.addEventListener("click", () => setReview(activeReviewIndex + 1, 1));
const carousel = document.getElementById("reviewCarousel");
carousel.addEventListener("pointerenter", () => { carouselPaused = true; window.clearTimeout(slideTimer); });
carousel.addEventListener("pointerleave", () => { carouselPaused = false; setReview(activeReviewIndex); });
carousel.addEventListener("focusin", () => { carouselPaused = true; window.clearTimeout(slideTimer); });
carousel.addEventListener("focusout", event => {
  if (!carousel.contains(event.relatedTarget)) { carouselPaused = false; setReview(activeReviewIndex); }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) window.clearTimeout(slideTimer);
  else setReview(activeReviewIndex);
});

form.addEventListener("input", () => {
  if (formMessage.textContent === "Please Fill In All Boxes Before You Review!") setFormMessage("");
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  setFormMessage("");
  const name = form.elements.name.value.trim();
  const email = form.elements.email.value.trim();
  const phone = form.elements.phone.value.trim();
  const review = form.elements.review.value.trim();
  const stars = Number(starsInput.value);
  const emailField = form.elements.email;

  if (!name || !email || !phone || !review || !stars) {
    setFormMessage("Please Fill In All Boxes Before You Review!");
    const firstMissing = !name ? form.elements.name : !email ? form.elements.email : !phone ? form.elements.phone : !review ? form.elements.review : starButtons[0];
    firstMissing.focus();
    return;
  }
  if (name.length < 2) {
    setFormMessage("Please enter a name with at least 2 characters.");
    form.elements.name.focus();
    return;
  }
  if (review.length < 10) {
    setFormMessage("Please add at least 10 characters to your review.");
    form.elements.review.focus();
    return;
  }
  if (!emailField.checkValidity()) {
    setFormMessage("Please enter a valid email address.");
    emailField.focus();
    return;
  }
  if (form.elements.website.value) {
    setFormMessage("We could not accept this submission. Please try again.");
    return;
  }
  if (Date.now() - formStartedAt < 2500) {
    setFormMessage("Please take a moment to complete your review and try again.");
    return;
  }

  try {
    const lastSubmission = Number(localStorage.getItem("deltaReviewLastSubmission") || 0);
    if (Date.now() - lastSubmission < 60_000) {
      setFormMessage("Please wait a minute before sending another review.", "neutral");
      return;
    }
  } catch { /* Storage may be disabled; server-side Firebase rules still validate submissions. */ }

  submitButton.disabled = true;
  submitButton.textContent = "Sending…";
  try {
    if (!auth.currentUser) await signInAnonymously(auth);
    await addDoc(collection(db, "reviewSubmissions"), {
      name,
      email,
      phone,
      review,
      stars,
      status: "pending",
      createdAt: serverTimestamp()
    });
    try { localStorage.setItem("deltaReviewLastSubmission", String(Date.now())); } catch { /* Optional local cooldown. */ }
    form.reset();
    starsInput.value = "";
    starButtons.forEach(button => {
      button.setAttribute("aria-checked", "false");
      button.tabIndex = -1;
      button.classList.remove("is-lit");
    });
    setFormMessage("Thank you! Your review was sent for approval. It will appear here after it is approved.", "success");
  } catch (error) {
    console.error("Could not submit customer review.", error);
    setFormMessage("We couldn't send your review right now. Please try again later.");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Send review <svg class="icon"><use href="#i-arrow"/></svg>';
  }
});

loadReviews();
