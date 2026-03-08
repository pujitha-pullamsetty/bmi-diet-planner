import { Link } from "react-router-dom";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("show");
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
  <div className="foodBorderWrapper">

      {/* PAGE */}
      <div className="homeV2">
        {/* HERO */}
        <header className="heroV2">
          {/* ✅ overlay for readability */}
          <div className="heroOverlay" />

          <div className="heroInner">
            <div className="heroLeft reveal">
              <div className="chipRow">
                <span className="chip">🥗 Food-First Plans</span>
                <span className="chip chip2">⚡ Fast & Simple</span>
                <span className="chip chip3">🤖 AI Buddy</span>
              </div>

              <h1 className="heroTitleV2">
                BMI-Aware Diet Planning <span className="highlight">Made Tasty</span>
              </h1>

              <p className="heroSubV2">
                Get clean, friendly diet plans based on BMI + rules — and refine them
                with Smart Diet Buddy (AI). Simple steps, good food, better consistency.
              </p>

              <div className="heroBtns">
                <Link to="/bmi" className="btnV2 btnPrimary">
                  Calculate BMI
                </Link>
                <Link to="/results" className="btnV2 btnPrimary">
                  View Diet Plans
                </Link>
              </div>

              <div className="miniStats">
                <div className="miniStat">
                  <div className="miniIcon">🔥</div>
                  <div>
                    <div className="miniTop">Calories</div>
                    <div className="miniBottom">Targets & meals</div>
                  </div>
                </div>
                <div className="miniStat">
                  <div className="miniIcon">🥑</div>
                  <div>
                    <div className="miniTop">Macros</div>
                    <div className="miniBottom">Balanced options</div>
                  </div>
                </div>
                <div className="miniStat">
                  <div className="miniIcon">📅</div>
                  <div>
                    <div className="miniTop">Plans</div>
                    <div className="miniBottom">Save results</div>
                  </div>
                </div>
              </div>
            </div>

           
          </div>
        </header>

        {/* QUICK MEAL PREVIEW */}
        <section className="wrap reveal">
          <div className="sectionHead">
            <h2 className="secTitle">Meal Plan Preview</h2>
            <p className="secSub">
              Each meal can show calories + macros.
            </p>
          </div>

          <div className="mealGrid">
            {[
              { t: "Breakfast", d: "Idli / Oats / Eggs", img: "/images/healthy.jpg", tag: "🍳 Protein" },
              { t: "Lunch", d: "Rice + Dal + Veg", img: "/images/healthy1.avif", tag: "🥗 Balanced" },
              { t: "Snack", d: "Fruits / Nuts", img: "/images/diet.jpg", tag: "🍌 Light" },
              { t: "Dinner", d: "Chapati + Curry", img: "/images/diet1.jpg", tag: "🌙 Easy" },
            ].map((m) => (
              <div className="mealCard tilt" key={m.t}>
                <div className="mealImg">
                  <img
                    src={m.img}
                    alt={m.t}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <div className="mealImgFallback"></div>
                </div>
                <div className="mealBody">
                  <span className="pill">{m.tag}</span>
                  <div className="mealTitle">{m.t}</div>
                  <div className="mealMeta">{m.d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURE SECTIONS */}
        <section className="wrap">
          <div className="featureGrid">
            <div className="featureCard reveal">
              <div className="featureTop">
                <div className="featureIcon">📏</div>
                <h3>BMI Calculator</h3>
              </div>
              <p>
                BMI helps you understand your category based on height & weight.
                Instant results and guidance.
              </p>
              <Link to="/bmi" className="btnV2 btnPrimary sm">
                Go to BMI Calculator
              </Link>
              <div className="featureImg">
                <div className="featureImgFallback"></div>
              </div>
            </div>

            <div className="featureCard reveal">
              <div className="featureTop">
                <div className="featureIcon">📚</div>
                <h3>Rule-Based Diet Plans</h3>
              </div>
              <p>
                Diet plans generated using BMI category + nutrition rules.
                Balanced, high-protein, low-fat and more.
              </p>
              <Link to="/rule-diet" className="btnV2 btnPrimary sm">
                View Diet Page
              </Link>
              <div className="featureImg">
                <div className="featureImgFallback"></div>
              </div>
            </div>

            <div className="featureCard reveal">
              <div className="featureTop">
                <div className="featureIcon">🗂️</div>
                <h3>Results</h3>
              </div>
              <p>
                All your previous and current diet plans are stored here.
                Quickly revisit & compare.
              </p>
              <Link to="/results" className="btnV2 btnPrimary sm">
                View Results
              </Link>
              <div className="featureImg">
                <div className="featureImgFallback"></div>
              </div>
            </div>

            <div className="featureCard reveal">
              <div className="featureTop">
                <div className="featureIcon">🤖</div>
                <h3>Smart Diet Buddy (AI)</h3>
              </div>
              <p>
                Refines rule-based plans into personalized options based on preferences,
                lifestyle, and goals.
              </p>
              <Link to="/smartbuddy" className="btnV2 btnPrimary sm">
                Try Smart Diet Buddy
              </Link>
              <div className="featureImg">
                <div className="featureImgFallback"></div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA STRIP */}
        <section className="wrap reveal">
          <div className="ctaStrip">
            <div>
              <h2 className="ctaTitle">Start with BMI → get a plan → refine with AI</h2>
              <p className="ctaSub">Two clicks lo journey start. Simple & friendly UI.</p>
            </div>
            <div className="ctaBtns">
              <Link to="/bmi" className="btnV2 btnPrimary">Start Now</Link>
              <Link to="/results" className="btnV2 btnPrimary">See Results</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
